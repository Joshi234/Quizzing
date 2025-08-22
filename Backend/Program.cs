using System.Net.WebSockets;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddSingleton<IGameService, GameService>();
builder.Services.AddSingleton<IConsoleService, ConsoleService>();

var app = builder.Build();

// Configure WebSocket
app.UseWebSockets();

// WebSocket endpoint
app.Map("/ws", async (HttpContext context, IGameService gameService) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var playerId = Guid.NewGuid().ToString();
        
        await gameService.HandleWebSocketAsync(webSocket, playerId);
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

// Health check endpoint
app.MapGet("/health", () => "OK");

// Serve static files (for frontend, optional)
app.UseDefaultFiles();
app.UseStaticFiles();

// Start console service in background
var consoleService = app.Services.GetRequiredService<IConsoleService>();
var cancellationTokenSource = new CancellationTokenSource();

_ = Task.Run(async () =>
{
    try
    {
        await consoleService.StartAsync(cancellationTokenSource.Token);
    }
    catch (OperationCanceledException)
    {
        // Expected when shutting down
    }
});

// Handle graceful shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    cancellationTokenSource.Cancel();
});

Console.WriteLine("Quiz Game Server starting...");
Console.WriteLine("WebSocket endpoint: ws://localhost:5000/ws");
Console.WriteLine("Health check: http://localhost:5000/health");
Console.WriteLine();

await app.RunAsync();
