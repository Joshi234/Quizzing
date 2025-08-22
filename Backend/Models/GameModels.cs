using System.Text.Json.Serialization;

namespace Backend.Models;

public record Player
{
    public required string Id { get; init; }
    public required string Nickname { get; init; }
    public bool Connected { get; set; } = true;
    public int TotalPoints { get; set; } = 0;
    public PlayerAnswer? CurrentAnswer { get; set; }
    public DateTime JoinedAt { get; init; } = DateTime.UtcNow;
}

public record PlayerAnswer
{
    public required string QuestionId { get; init; }
    public required string Option { get; init; } // "A", "B", "C", "D"
    public required DateTime ReceivedAt { get; init; }
    public bool? Correct { get; set; }
    public int? PointsAwarded { get; set; }
}

public record Question
{
    public required string Id { get; init; }
    public required string Text { get; init; }
    public required Dictionary<string, string> Options { get; init; } // {"A": "Mars", "B": "Venus", ...}
    public required string Correct { get; init; } // "A", "B", "C", "D"
    public required int DurationMs { get; init; }
    public DateTime? AskedAt { get; set; }
    public DateTime? ClosesAt { get; set; }
}

public enum GameStatus
{
    Lobby,
    Active,
    Revealing
}

public class GameState
{
    public GameStatus Status { get; set; } = GameStatus.Lobby;
    public Dictionary<string, Player> Players { get; } = new();
    public Question? CurrentQuestion { get; set; }
    public List<Question> History { get; } = new();
    public int QuestionNumber { get; set; } = 0;
}

// WebSocket Message Types
public record WebSocketMessage<T>
{
    [JsonPropertyName("type")]
    public required string Type { get; init; }
    
    [JsonPropertyName("data")]
    public required T Data { get; init; }
}

// Client to Server Messages
public record JoinMessage
{
    [JsonPropertyName("nickname")]
    public required string Nickname { get; init; }
}

public record AnswerMessage
{
    [JsonPropertyName("questionId")]
    public required string QuestionId { get; init; }
    
    [JsonPropertyName("option")]
    public required string Option { get; init; }
    
    [JsonPropertyName("clientTs")]
    public required long ClientTs { get; init; }
}

public record PingMessage
{
    [JsonPropertyName("nonce")]
    public required string Nonce { get; init; }
}

// Server to Client Messages
public record LobbyStateMessage
{
    [JsonPropertyName("players")]
    public required List<PlayerInfo> Players { get; init; }
    
    [JsonPropertyName("gameState")]
    public required string GameState { get; init; }
}

public record PlayerInfo
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }
    
    [JsonPropertyName("nickname")]
    public required string Nickname { get; init; }
}

public record GameStartedMessage
{
    [JsonPropertyName("startAt")]
    public required string StartAt { get; init; }
}

public record QuestionMessage
{
    [JsonPropertyName("questionId")]
    public required string QuestionId { get; init; }
    
    [JsonPropertyName("text")]
    public required string Text { get; init; }
    
    [JsonPropertyName("options")]
    public required Dictionary<string, string> Options { get; init; }
    
    [JsonPropertyName("durationMs")]
    public required int DurationMs { get; init; }
    
    [JsonPropertyName("askedAt")]
    public required string AskedAt { get; init; }
}

public record TimerTickMessage
{
    [JsonPropertyName("questionId")]
    public required string QuestionId { get; init; }
    
    [JsonPropertyName("remainingMs")]
    public required int RemainingMs { get; init; }
}

public record AnswerAckMessage
{
    [JsonPropertyName("questionId")]
    public required string QuestionId { get; init; }
    
    [JsonPropertyName("receivedAt")]
    public required string ReceivedAt { get; init; }
}

public record AnswerResultMessage
{
    [JsonPropertyName("questionId")]
    public required string QuestionId { get; init; }
    
    [JsonPropertyName("correct")]
    public required string Correct { get; init; }
    
    [JsonPropertyName("youCorrect")]
    public required bool YouCorrect { get; init; }
    
    [JsonPropertyName("yourPointsThisQ")]
    public required int YourPointsThisQ { get; init; }
}

public record LeaderboardMessage
{
    [JsonPropertyName("entries")]
    public required List<LeaderboardEntry> Entries { get; init; }
    
    [JsonPropertyName("questionNumber")]
    public required int QuestionNumber { get; init; }
}

public record LeaderboardEntry
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }
    
    [JsonPropertyName("nickname")]
    public required string Nickname { get; init; }
    
    [JsonPropertyName("totalPoints")]
    public required int TotalPoints { get; init; }
    
    [JsonPropertyName("lastDelta")]
    public int? LastDelta { get; init; }
}

public record SystemMessage
{
    [JsonPropertyName("message")]
    public required string Message { get; init; }
}

public record PongMessage
{
    [JsonPropertyName("nonce")]
    public required string Nonce { get; init; }
    
    [JsonPropertyName("serverTs")]
    public required long ServerTs { get; init; }
}

public record ErrorMessage
{
    [JsonPropertyName("code")]
    public required string Code { get; init; }
    
    [JsonPropertyName("message")]
    public required string Message { get; init; }
}