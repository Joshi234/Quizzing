using System.Text.RegularExpressions;
using Backend.Models;

namespace Backend.Services;

public interface IConsoleService
{
    Task StartAsync(CancellationToken cancellationToken);
}

public class ConsoleService : IConsoleService
{
    private readonly IGameService _gameService;

    public ConsoleService(IGameService gameService)
    {
        _gameService = gameService;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        Console.WriteLine("Quiz Game Console - Type /help for commands");
        ShowPrompt();

        while (!cancellationToken.IsCancellationRequested)
        {
            var input = await ReadLineAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(input))
            {
                ShowPrompt();
                continue;
            }

            await ProcessCommandAsync(input.Trim());
            ShowPrompt();
        }
    }

    private async Task ProcessCommandAsync(string input)
    {
        try
        {
            if (!input.StartsWith('/'))
            {
                Console.WriteLine("Commands must start with /. Type /help for available commands.");
                return;
            }

            var parts = ParseCommand(input);
            var command = parts[0].ToLowerInvariant();

            switch (command)
            {
                case "/help":
                    ShowHelp();
                    break;

                case "/reset":
                    await _gameService.ResetGameAsync();
                    break;

                case "/start":
                    await _gameService.StartGameAsync();
                    break;

                case "/players":
                    ShowPlayers();
                    break;

                case "/ask":
                    await HandleAskCommand(input);
                    break;

                case "/reveal":
                    await _gameService.RevealAnswersAsync();
                    break;

                case "/scores":
                    ShowScores();
                    break;

                case "/next":
                    Console.WriteLine("Ready for next question. Use /ask to send a question.");
                    break;

                case "/end":
                    await _gameService.EndGameAsync();
                    break;

                default:
                    Console.WriteLine($"Unknown command: {command}. Type /help for available commands.");
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing command: {ex.Message}");
        }
    }

    private async Task HandleAskCommand(string input)
    {
        try
        {
            // Parse: /ask "Question text" Option1|Option2|Option3|Option4 correct=A time=20
            var match = Regex.Match(input, 
                @"/ask\s+""([^""]+)""\s+([^|]+)\|([^|]+)\|([^|]+)\|([^\s]+)\s+correct=([ABCD])\s+time=(\d+)",
                RegexOptions.IgnoreCase);

            if (!match.Success)
            {
                Console.WriteLine("Invalid /ask format. Expected:");
                Console.WriteLine("/ask \"Question text\" OptionA|OptionB|OptionC|OptionD correct=A time=20");
                Console.WriteLine("\nExample:");
                Console.WriteLine("/ask \"What is the capital of France?\" Paris|Berlin|Madrid|Rome correct=A time=20");
                return;
            }

            var questionText = match.Groups[1].Value;
            var optionA = match.Groups[2].Value.Trim();
            var optionB = match.Groups[3].Value.Trim();
            var optionC = match.Groups[4].Value.Trim();
            var optionD = match.Groups[5].Value.Trim();
            var correct = match.Groups[6].Value.ToUpperInvariant();
            var timeSeconds = int.Parse(match.Groups[7].Value);

            if (timeSeconds < 5 || timeSeconds > 300)
            {
                Console.WriteLine("Time must be between 5 and 300 seconds");
                return;
            }

            var question = new Question
            {
                Id = $"q_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Random.Shared.Next(1000, 9999)}",
                Text = questionText,
                Options = new Dictionary<string, string>
                {
                    ["A"] = optionA,
                    ["B"] = optionB,
                    ["C"] = optionC,
                    ["D"] = optionD
                },
                Correct = correct,
                DurationMs = timeSeconds * 1000
            };

            await _gameService.AskQuestionAsync(question);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error parsing ask command: {ex.Message}");
        }
    }

    private void ShowHelp()
    {
        Console.WriteLine("\nAvailable Commands:");
        Console.WriteLine("  /help     - Show this help message");
        Console.WriteLine("  /reset    - Reset game to lobby state");
        Console.WriteLine("  /start    - Start the game (lock lobby)");
        Console.WriteLine("  /players  - List connected players");
        Console.WriteLine("  /ask      - Ask a question");
        Console.WriteLine("  /reveal   - Force reveal current question answers");
        Console.WriteLine("  /scores   - Show current scores");
        Console.WriteLine("  /next     - Ready for next question");
        Console.WriteLine("  /end      - End game and show final scores");
        Console.WriteLine("\nAsk Command Format:");
        Console.WriteLine("  /ask \"Question text\" OptionA|OptionB|OptionC|OptionD correct=A time=20");
        Console.WriteLine("\nExample:");
        Console.WriteLine("  /ask \"What is the capital of France?\" Paris|Berlin|Madrid|Rome correct=A time=20");
        Console.WriteLine();
    }

    private void ShowPlayers()
    {
        var players = _gameService.GetPlayers();
        var gameState = _gameService.GetGameState();
        
        Console.WriteLine($"\nGame Status: {gameState.Status}");
        Console.WriteLine($"Connected Players ({players.Count(p => p.Connected)}):");
        
        foreach (var player in players.Where(p => p.Connected))
        {
            Console.WriteLine($"  - {player.Nickname} (Points: {player.TotalPoints})");
        }
        
        if (players.Any(p => !p.Connected))
        {
            Console.WriteLine("Disconnected Players:");
            foreach (var player in players.Where(p => !p.Connected))
            {
                Console.WriteLine($"  - {player.Nickname} (Points: {player.TotalPoints}) [DISCONNECTED]");
            }
        }
        Console.WriteLine();
    }

    private void ShowScores()
    {
        var players = _gameService.GetPlayers();
        var gameState = _gameService.GetGameState();
        
        Console.WriteLine($"\nLeaderboard (Question {gameState.QuestionNumber}):");
        
        var rankedPlayers = players
            .Where(p => p.Connected)
            .OrderByDescending(p => p.TotalPoints)
            .ThenBy(p => p.JoinedAt)
            .ToList();

        for (int i = 0; i < rankedPlayers.Count; i++)
        {
            var player = rankedPlayers[i];
            var lastPoints = player.CurrentAnswer?.PointsAwarded ?? 0;
            var lastPointsStr = lastPoints > 0 ? $" (+{lastPoints})" : "";
            Console.WriteLine($"  {i + 1}. {player.Nickname}: {player.TotalPoints} points{lastPointsStr}");
        }
        Console.WriteLine();
    }

    private static List<string> ParseCommand(string input)
    {
        var parts = new List<string>();
        var inQuotes = false;
        var current = "";

        for (int i = 0; i < input.Length; i++)
        {
            var ch = input[i];
            
            if (ch == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (ch == ' ' && !inQuotes)
            {
                if (!string.IsNullOrEmpty(current))
                {
                    parts.Add(current);
                    current = "";
                }
            }
            else
            {
                current += ch;
            }
        }

        if (!string.IsNullOrEmpty(current))
        {
            parts.Add(current);
        }

        return parts;
    }

    private static void ShowPrompt()
    {
        Console.Write("quiz> ");
    }

    private static async Task<string?> ReadLineAsync(CancellationToken cancellationToken)
    {
        return await Task.Run(() =>
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                if (Console.KeyAvailable)
                {
                    return Console.ReadLine();
                }
                Thread.Sleep(100);
            }
            return null;
        }, cancellationToken);
    }
}