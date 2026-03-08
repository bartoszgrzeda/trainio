# Run Locally (Backend + iOS Frontend)

This project supports running backend and iOS frontend together with one command and hot reload.

## Prerequisites

- .NET SDK 10.x
- Node.js >= 22.11.0
- Xcode + iOS Simulator
- Ruby/Bundler + CocoaPods (for iOS pods)

## First-time setup

From repository root:

```bash
cd app
npm install
bundle install
bundle exec pod install
```

## One-command dev (recommended)

From repository root:

```bash
make dev-ios SIMULATOR="iPhone 16"
```

What this starts:

- Backend API via `dotnet watch` at `http://localhost:3000` (C# hot reload)
- Metro dev server on `http://localhost:8081` (React Native Fast Refresh)
- iOS app build + launch on selected simulator

`make dev-ios` always restarts the API on port `3000` to avoid stale backend processes.

Keep this command running while developing.  
Use `Ctrl+C` in that terminal to stop all started processes.

## Optional parameters

```bash
make dev-ios SIMULATOR="iPhone 16 Pro"
make dev-ios API_URL="http://localhost:3000"
make dev-ios METRO_PORT=8081
```

## Manual full reload (simulator)

- Press `Cmd+R` in iOS Simulator.

## Known backend gaps (current state)

- `POST /api/uploads/profile-photo` is not implemented yet (returns 404).
- `POST /api/trainings/{trainingId}/start` currently returns 404 placeholder.
