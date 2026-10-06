from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .game import GRID_SIZES, GameState, collect_word, new_game
from .data import get_next_game_id,get_daily_puzzle,get_game_history,get_history_with_difficulty,get_leaderboard,get_user,save_game

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "WordQuest API is running."}


@app.get("/api/user")
def user(username):
    return get_user(username)


@app.get("/api/user/history")
def user_history(username):
    return get_history_with_difficulty(username)


@app.get("/api/leaderboard")
def leaderboard():
    return get_leaderboard()


@app.post("/api/game/start")
def start_game(grid: dict):
    username = grid.get("username")

    grid_size = grid.get("gridSize", 5)
    mode = grid.get("mode", "free")
    puzzle_id = None

    if grid_size not in GRID_SIZES:
        return {"accepted": False,"message": "Grid size must be 5, 6, 7, 8, or 9."}

    if mode == "daily":
        puzzle = get_daily_puzzle()
        if not puzzle:
            return {"accepted": False,"message": "Today's puzzle is not available."}

        history = get_game_history(username)
        for game in history:
            if (game.get("mode") == "daily"and game.get("puzzleId") == puzzle.get("puzzleId")):
                return {"accepted": False,"alreadyPlayed": True,"message": "You already played today's daily."}

        grid = puzzle["grid"]
        grid_size = int(puzzle["gridSize"])
        puzzle_id = int(puzzle["puzzleId"])

        game = new_game(grid_size)
        game.grid = grid
    else:
        game = new_game(grid_size)

    game_id = get_next_game_id(username)

    return {
        "accepted": True,
        "gameId": game_id,
        "puzzleId": puzzle_id,
        "grid": game.grid,
        "gridSize": grid_size,
        "score": game.score,
        "found": game.found,
    }


@app.post("/api/game/collect")
def collect(grid: dict):
    cells = grid.get("cells", [])
    current_grid = grid.get("grid", [])
    score = grid.get("score", 0)
    found = grid.get("found", [])
    game = GameState(grid=current_grid,score=int(score),found=found)
    return collect_word(game, cells)


@app.post("/api/game/finish")
def finish_game(grid: dict):
    username = grid.get("username")
    game_id = grid.get("gameId")
    mode = grid.get("mode", "free")
    grid_size = grid.get("gridSize", 5)
    puzzle_id = grid.get("puzzleId")
    score = grid.get("score", 0)
    words = grid.get("found", [])
    duration = grid.get("duration", 0)

    saved_game = save_game(
        username=username,
        game_id=game_id,
        mode=mode,
        grid_size=grid_size,
        score=int(score),
        words=words,
        duration=int(duration),
        puzzle_id=puzzle_id,
    )

    return {"accepted": True, "game": saved_game}