using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public interface IGameService
{
    Task HandleWebSocketAsync(WebSocket webSocket, string playerId);
    Task StartGameAsync();
    Task AskQuestionAsync(Question question);
    Task RevealAnswersAsync();
    Task EndGameAsync();
    Task ResetGameAsync();
    GameState GetGameState();
    List<Player> GetPlayers();
}

public class GameService : IGameService
{
    private readonly GameState _gameState = new();
    private readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    private readonly SemaphoreSlim _gameStateLock = new(1, 1);
    private readonly Timer? _timer;
    
    private const int BasePoints = 1000;
    private const int MinPoints = 100;

    public GameService()
    {
        // Start timer for periodic updates
        _timer = new Timer(TimerTick, null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
    }

    public async Task HandleWebSocketAsync(WebSocket webSocket, string playerId)
    {
        _connections[playerId] = webSocket;
        
        var buffer = new byte[1024 * 4];
        
        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    await HandleMessageAsync(playerId, json);
                }
                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    await HandlePlayerDisconnectedAsync(playerId);
                    break;
                }
            }
        }
        catch (WebSocketException)
        {
            await HandlePlayerDisconnectedAsync(playerId);
        }
        finally
        {
            _connections.TryRemove(playerId, out _);
        }
    }

    private async Task HandleMessageAsync(string playerId, string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            
            if (!root.TryGetProperty("type", out var typeElement))
                return;
                
            var type = typeElement.GetString();
            
            switch (type)
            {
                case "join":
                    if (root.TryGetProperty("data", out var joinData))
                    {
                        var joinMessage = JsonSerializer.Deserialize<JoinMessage>(joinData.GetRawText());
                        if (joinMessage != null)
                            await HandleJoinAsync(playerId, joinMessage);
                    }
                    break;
                    
                case "answer":
                    if (root.TryGetProperty("data", out var answerData))
                    {
                        var answerMessage = JsonSerializer.Deserialize<AnswerMessage>(answerData.GetRawText());
                        if (answerMessage != null)
                            await HandleAnswerAsync(playerId, answerMessage);
                    }
                    break;
                    
                case "ping":
                    if (root.TryGetProperty("data", out var pingData))
                    {
                        var pingMessage = JsonSerializer.Deserialize<PingMessage>(pingData.GetRawText());
                        if (pingMessage != null)
                            await HandlePingAsync(playerId, pingMessage);
                    }
                    break;
            }
        }
        catch (JsonException ex)
        {
            await SendErrorAsync(playerId, "INVALID_JSON", ex.Message);
        }
    }

    private async Task HandleJoinAsync(string playerId, JoinMessage message)
    {
        await _gameStateLock.WaitAsync();
        try
        {
            // Validate nickname
            var nickname = message.Nickname?.Trim();
            if (string.IsNullOrEmpty(nickname) || nickname.Length < 2 || nickname.Length > 20)
            {
                await SendErrorAsync(playerId, "INVALID_NICKNAME", "Nickname must be 2-20 characters");
                return;
            }

            // Check if nickname is already taken
            if (_gameState.Players.Values.Any(p => p.Nickname.Equals(nickname, StringComparison.OrdinalIgnoreCase)))
            {
                await SendErrorAsync(playerId, "NICKNAME_TAKEN", "This nickname is already taken");
                return;
            }

            // Add or update player
            if (_gameState.Players.TryGetValue(playerId, out var existingPlayer))
            {
                // Reconnection
                existingPlayer.Connected = true;
            }
            else
            {
                // New player
                if (_gameState.Status != GameStatus.Lobby)
                {
                    await SendErrorAsync(playerId, "GAME_IN_PROGRESS", "Cannot join game in progress");
                    return;
                }

                var player = new Player
                {
                    Id = playerId,
                    Nickname = nickname
                };
                _gameState.Players[playerId] = player;
            }

            // Send lobby state to all players
            await BroadcastLobbyStateAsync();
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    private async Task HandleAnswerAsync(string playerId, AnswerMessage message)
    {
        await _gameStateLock.WaitAsync();
        try
        {
            if (!_gameState.Players.TryGetValue(playerId, out var player))
                return;

            if (_gameState.CurrentQuestion == null || 
                _gameState.CurrentQuestion.Id != message.QuestionId ||
                _gameState.Status != GameStatus.Active)
            {
                await SendErrorAsync(playerId, "INVALID_QUESTION", "No active question or question mismatch");
                return;
            }

            // Check if question is still accepting answers
            if (_gameState.CurrentQuestion.ClosesAt.HasValue && 
                DateTime.UtcNow > _gameState.CurrentQuestion.ClosesAt)
            {
                await SendErrorAsync(playerId, "QUESTION_CLOSED", "Question is no longer accepting answers");
                return;
            }

            // Check if player already answered
            if (player.CurrentAnswer?.QuestionId == message.QuestionId)
            {
                await SendErrorAsync(playerId, "ALREADY_ANSWERED", "You have already answered this question");
                return;
            }

            // Validate option
            if (!new[] { "A", "B", "C", "D" }.Contains(message.Option))
            {
                await SendErrorAsync(playerId, "INVALID_OPTION", "Option must be A, B, C, or D");
                return;
            }

            // Record answer
            var answer = new PlayerAnswer
            {
                QuestionId = message.QuestionId,
                Option = message.Option,
                ReceivedAt = DateTime.UtcNow
            };
            
            player.CurrentAnswer = answer;

            // Send acknowledgment
            await SendToPlayerAsync(playerId, "answer_ack", new AnswerAckMessage
            {
                QuestionId = message.QuestionId,
                ReceivedAt = answer.ReceivedAt.ToString("O")
            });
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    private async Task HandlePingAsync(string playerId, PingMessage message)
    {
        await SendToPlayerAsync(playerId, "pong", new PongMessage
        {
            Nonce = message.Nonce,
            ServerTs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        });
    }

    private async Task HandlePlayerDisconnectedAsync(string playerId)
    {
        await _gameStateLock.WaitAsync();
        try
        {
            if (_gameState.Players.TryGetValue(playerId, out var player))
            {
                player.Connected = false;
                await BroadcastLobbyStateAsync();
            }
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    public async Task StartGameAsync()
    {
        await _gameStateLock.WaitAsync();
        try
        {
            if (_gameState.Status != GameStatus.Lobby)
            {
                Console.WriteLine("Game is not in lobby state");
                return;
            }

            _gameState.Status = GameStatus.Active;
            
            await BroadcastAsync("game_started", new GameStartedMessage
            {
                StartAt = DateTime.UtcNow.ToString("O")
            });
            
            Console.WriteLine($"Game started with {_gameState.Players.Count} players");
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    public async Task AskQuestionAsync(Question question)
    {
        await _gameStateLock.WaitAsync();
        try
        {
            if (_gameState.Status != GameStatus.Active)
            {
                Console.WriteLine("Game is not active");
                return;
            }

            question.AskedAt = DateTime.UtcNow;
            question.ClosesAt = question.AskedAt.Value.AddMilliseconds(question.DurationMs);
            
            _gameState.CurrentQuestion = question;
            _gameState.QuestionNumber++;
            
            // Clear previous answers
            foreach (var player in _gameState.Players.Values)
            {
                player.CurrentAnswer = null;
            }

            await BroadcastAsync("question", new QuestionMessage
            {
                QuestionId = question.Id,
                Text = question.Text,
                Options = question.Options,
                DurationMs = question.DurationMs,
                AskedAt = question.AskedAt.Value.ToString("O")
            });
            
            Console.WriteLine($"Question asked: {question.Text}");
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    public async Task RevealAnswersAsync()
    {
        await _gameStateLock.WaitAsync();
        try
        {
            if (_gameState.CurrentQuestion == null)
            {
                Console.WriteLine("No active question to reveal");
                return;
            }

            _gameState.Status = GameStatus.Revealing;
            
            var question = _gameState.CurrentQuestion;
            
            // Calculate scores
            foreach (var player in _gameState.Players.Values)
            {
                if (player.CurrentAnswer?.QuestionId == question.Id)
                {
                    var answer = player.CurrentAnswer;
                    var isCorrect = answer.Option == question.Correct;
                    answer.Correct = isCorrect;
                    
                    if (isCorrect)
                    {
                        var responseTime = answer.ReceivedAt - question.AskedAt!.Value;
                        var points = CalculatePoints(responseTime.TotalMilliseconds, question.DurationMs);
                        answer.PointsAwarded = points;
                        player.TotalPoints += points;
                    }
                    else
                    {
                        answer.PointsAwarded = 0;
                    }

                    // Send individual result
                    await SendToPlayerAsync(player.Id, "answer_result", new AnswerResultMessage
                    {
                        QuestionId = question.Id,
                        Correct = question.Correct,
                        YouCorrect = isCorrect,
                        YourPointsThisQ = answer.PointsAwarded ?? 0
                    });
                }
            }

            // Move question to history
            _gameState.History.Add(question);
            _gameState.CurrentQuestion = null;
            _gameState.Status = GameStatus.Active;

            // Broadcast leaderboard
            await BroadcastLeaderboardAsync();
            
            Console.WriteLine($"Answers revealed. Correct answer was: {question.Correct}");
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    public async Task EndGameAsync()
    {
        await _gameStateLock.WaitAsync();
        try
        {
            await BroadcastLeaderboardAsync();
            await ResetGameAsync();
            Console.WriteLine("Game ended and reset to lobby");
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    public async Task ResetGameAsync()
    {
        await _gameStateLock.WaitAsync();
        try
        {
            _gameState.Status = GameStatus.Lobby;
            _gameState.CurrentQuestion = null;
            _gameState.History.Clear();
            _gameState.QuestionNumber = 0;
            
            foreach (var player in _gameState.Players.Values)
            {
                player.TotalPoints = 0;
                player.CurrentAnswer = null;
            }

            await BroadcastLobbyStateAsync();
            Console.WriteLine("Game reset to lobby state");
        }
        finally
        {
            _gameStateLock.Release();
        }
    }

    public GameState GetGameState() => _gameState;

    public List<Player> GetPlayers() => _gameState.Players.Values.ToList();

    private int CalculatePoints(double responseTimeMs, int durationMs)
    {
        var normalizedTime = Math.Max(0, Math.Min(responseTimeMs / durationMs, 1));
        var points = (int)Math.Round(BasePoints * (1 - normalizedTime));
        return Math.Max(points, MinPoints);
    }

    private async Task BroadcastLobbyStateAsync()
    {
        var message = new LobbyStateMessage
        {
            Players = _gameState.Players.Values
                .Where(p => p.Connected)
                .Select(p => new PlayerInfo { Id = p.Id, Nickname = p.Nickname })
                .ToList(),
            GameState = _gameState.Status.ToString().ToLowerInvariant()
        };

        await BroadcastAsync("lobby_state", message);
    }

    private async Task BroadcastLeaderboardAsync()
    {
        var entries = _gameState.Players.Values
            .Where(p => p.Connected)
            .OrderByDescending(p => p.TotalPoints)
            .ThenBy(p => p.JoinedAt)
            .Select(p => new LeaderboardEntry
            {
                Id = p.Id,
                Nickname = p.Nickname,
                TotalPoints = p.TotalPoints,
                LastDelta = p.CurrentAnswer?.PointsAwarded
            })
            .ToList();

        await BroadcastAsync("leaderboard", new LeaderboardMessage
        {
            Entries = entries,
            QuestionNumber = _gameState.QuestionNumber
        });
    }

    private async Task BroadcastAsync<T>(string type, T data)
    {
        var message = new WebSocketMessage<T> { Type = type, Data = data };
        var json = JsonSerializer.Serialize(message, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        var bytes = Encoding.UTF8.GetBytes(json);

        var tasks = _connections.Values
            .Where(ws => ws.State == WebSocketState.Open)
            .Select(async ws =>
            {
                try
                {
                    await ws.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
                }
                catch (WebSocketException)
                {
                    // Connection closed, will be cleaned up later
                }
            });

        await Task.WhenAll(tasks);
    }

    private async Task SendToPlayerAsync<T>(string playerId, string type, T data)
    {
        if (!_connections.TryGetValue(playerId, out var webSocket) || 
            webSocket.State != WebSocketState.Open)
            return;

        var message = new WebSocketMessage<T> { Type = type, Data = data };
        var json = JsonSerializer.Serialize(message, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        var bytes = Encoding.UTF8.GetBytes(json);

        try
        {
            await webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
        }
        catch (WebSocketException)
        {
            // Connection closed
        }
    }

    private async Task SendErrorAsync(string playerId, string code, string message)
    {
        await SendToPlayerAsync(playerId, "error", new ErrorMessage
        {
            Code = code,
            Message = message
        });
    }

    private async void TimerTick(object? state)
    {
        if (_gameState.CurrentQuestion?.AskedAt.HasValue == true && 
            _gameState.CurrentQuestion?.ClosesAt.HasValue == true &&
            _gameState.Status == GameStatus.Active)
        {
            var remaining = _gameState.CurrentQuestion.ClosesAt.Value - DateTime.UtcNow;
            var remainingMs = Math.Max(0, (int)remaining.TotalMilliseconds);

            if (remainingMs > 0)
            {
                await BroadcastAsync("timer_tick", new TimerTickMessage
                {
                    QuestionId = _gameState.CurrentQuestion.Id,
                    RemainingMs = remainingMs
                });
            }
            else
            {
                await RevealAnswersAsync();
            }
        }
    }
}