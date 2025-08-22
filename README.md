# Quizzing

A real-time multiplayer quiz game built with C#/.NET backend and React frontend.

## Features

- Real-time WebSocket communication
- Host-controlled game flow via console commands
- Speed-weighted scoring system
- Live leaderboards
- Responsive dark theme UI
- Timer with visual countdown
- Multiple choice questions with instant feedback

## Architecture

- **Backend**: .NET 8 console application with Kestrel web server and WebSocket support
- **Frontend**: React + TypeScript with Vite, styled with Tailwind CSS
- **Communication**: JSON messages over WebSockets
- **State Management**: In-memory game state (no persistence)

## Quick Start

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm

### Running the Application

1. **Start the Backend**:
   ```bash
   cd Backend
   dotnet run
   ```
   The server will start on http://localhost:5000 with WebSocket endpoint at ws://localhost:5000/ws

2. **Start the Frontend**:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

3. **Open Multiple Browser Windows**:
   - Open http://localhost:5173 in multiple browser windows/tabs
   - Enter different nicknames to join the game

4. **Control the Game** (in the backend console):
   ```
   /help                    # Show available commands
   /players                 # List connected players
   /start                   # Start the game
   /ask "Question?" A|B|C|D correct=A time=20
   /reveal                  # Force reveal answers
   /scores                  # Show leaderboard
   /end                     # End game
   ```

## Console Commands

- `/help` - Show command list
- `/reset` - Reset game to lobby state
- `/start` - Start the game (lock lobby)
- `/players` - List connected players
- `/ask` - Ask a question with format: `/ask "Question text" OptionA|OptionB|OptionC|OptionD correct=A time=20`
- `/reveal` - Force reveal current question answers
- `/scores` - Show current scores
- `/next` - Ready for next question
- `/end` - End game and show final scores

## Example Game Flow

1. Players join by entering nicknames
2. Host runs `/start` to begin
3. Host asks questions: `/ask "What is 2+2?" Two|Three|Four|Five correct=C time=15`
4. Players select and confirm answers within the time limit
5. Answers are automatically revealed when timer expires
6. Leaderboard shows updated scores
7. Repeat with more questions or `/end` to finish

## Scoring System

- **Base Points**: 1000 points for correct answers
- **Speed Bonus**: Points scaled by response time (faster = more points)
- **Minimum Points**: 100 points for any correct answer
- **Incorrect**: 0 points
- **Tie Breakers**: Total points → average response time → join time

## Development

### Building

```bash
# Backend
cd Backend
dotnet build

# Frontend
cd Frontend
npm run build
```

### Project Structure

```
├── Backend/
│   ├── Models/         # Data models and message types
│   ├── Services/       # Game logic and console handler
│   └── Program.cs      # Main application entry point
├── Frontend/
│   ├── src/
│   │   ├── components/ # React UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Utility functions
│   └── package.json
└── README.md
```