import { useEffect, useState } from "react";
import { Clock3, Pause, Play, RotateCcw, Trophy, Zap } from "lucide-react";
import GameStat from "../components/GameStat.jsx";
import GameGrid from "../components/GameGrid.jsx";
import WordList from "../components/WordList.jsx";
import api from "../api.js";

export const GRID_SIZES = [5, 6, 7, 8, 9];
export const DEFAULT_GRID_SIZE = 5;
export const ROUND_SECONDS = 90;
export const GRID_UNLOCK_SCORE = { 5: 0, 6: 200, 7: 400, 8: 550, 9: 800 };

export default function PlayPage({ user, setUser, daily = false }) {
  const isDaily = daily;
  const highestScore = user?.best || 0;
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [restartKey, setRestartKey] = useState(0);
  const [grid, setGrid] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [puzzleId, setPuzzleId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState([]);
  const [newCells, setNewCells] = useState([]);
  const [message, setMessage] = useState("Drag through adjacent letters to build a word.");
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const resetState = () => {
    setGrid([]);
    setSelected([]);
    setNewCells([]);
    setPaused(false);
    setSeconds(ROUND_SECONDS);
    setScore(0);
    setFound([]);
    setGameId(null);
    setPuzzleId(null);
    setStartedAt(null);
    setFinished(false);
  };

  useEffect(() => {
    setLoading(true);
    resetState();

    if (isDaily) {
      setMessage("Loading today's puzzle...");
    } else {
      setMessage("Drag through adjacent letters to build a word.");
    }

    async function startGame() {
      try {
        const res = await api.post("/api/game/start", { username: user.username, gridSize, mode: isDaily ? "daily" : "free" });
        const data = res.data;

        if (!data.accepted) {
          setMessage(data.message || "Unable to start game.");
          setLoading(false);
          return;
        }

        setGrid(data.grid);
        setGameId(data.gameId);
        setPuzzleId(data.puzzleId || null);
        setScore(data.score);
        setFound(data.found);
        setStartedAt(Date.now());
        setLoading(false);

        if (isDaily) {
          setMessage(`Daily #${data.puzzleId || 1}`);
        } else {
          setMessage("Drag through adjacent letters to build a word.");
        }
      } catch (err) {
        setMessage(err.response?.data?.detail || err.message || "Unable to start game.");
        setLoading(false);
      }
    }

    startGame();
  }, [user.username, gridSize, restartKey, isDaily]);

  useEffect(() => {
    if (paused || seconds <= 0 || loading || finished) {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [paused, seconds, loading, finished]);

  useEffect(() => {
    if (seconds !== 0 || gameId === null || loading || finished || startedAt === null) return;

    setFinished(true);
    setPaused(true);
    setSelected([]);
    setMessage("Time's up! Saving your game...");

    async function finishGame() {
      try {
        const duration = Math.floor((Date.now() - startedAt) / 1000);

        const res = await api.post("/api/game/finish", {
          username: user.username,
          gameId,
          mode: isDaily ? "daily" : "free",
          gridSize,
          puzzleId,
          score,
          found,
          duration,
        });
        const data = res.data;

        if (!data.accepted) {
          setMessage(data.message || "Unable to finish game.");
          return;
        }

        const savedGame = data.game;

        setScore(savedGame.score);
        setFound(savedGame.words || []);
        setGameId(null);
        setStartedAt(null);
        setMessage(`Game finished! Score: ${savedGame.score}`);

        setUser((value) => ({
          ...value,
          best: Math.max(value.best || 0, savedGame.score || 0),
          words: (value.words || 0) + (savedGame.wordCount || 0),
          rounds: (value.rounds || 0) + 1,
        }));
      } catch (err) {
        setMessage(err.message || "Unable to finish game.");
      }
    }

    finishGame();
  }, [seconds, gameId, loading, finished, startedAt, user.username, setUser, isDaily, gridSize, puzzleId, score, found]);

  const reset = () => {
    resetState();
    setMessage(isDaily ? "Loading today's puzzle..." : "Drag through adjacent letters to build a word.");
    setRestartKey((value) => value + 1);
  };

  const changeGridSize = (size) => {
    if (isDaily) return;

    setGridSize(size);
    resetState();
    setMessage(`New ${size}x${size} random grid.`);
    setRestartKey((value) => value + 1);
  };

  const handleStart = (cell) => {
    if (!running || grid.length === 0) return;
    setSelected([cell]);
  };

  const handleMove = (cell) => {
    if (!running || grid.length === 0 || selected.length === 0) return;
    const previous = selected[selected.length - 1];
    const rowDistance = Math.abs(cell[0] - previous[0]);
    const columnDistance = Math.abs(cell[1] - previous[1]);
    const adjacent = rowDistance <= 1 && columnDistance <= 1 && (rowDistance !== 0 || columnDistance !== 0);
    if (!adjacent) return;
    const alreadySelected = selected.some(([row, column]) => row === cell[0] && column === cell[1]);
    if (alreadySelected) return;
    setSelected([...selected, cell]);
  };

  const handleFinish = () => {
    if (!running || finished) {
      setSelected([]);
      return;
    }

    const currentSelection = selected;

    setSelected([]);

    if (currentSelection.length < 3) {
      setMessage("Select at least 3 letters.");
      return;
    }

    async function collect() {
      try {
        const res = await api.post("/api/game/collect", { username: user.username, gameId, grid, score, found, cells: currentSelection });
        const result = res.data;

        if (!result.accepted) {
          setMessage(result.validation?.reason || "Word could not be collected.");
          return;
        }

        setGrid(result.grid);
        setScore(result.score);
        setFound(result.found);
        setNewCells(result.newCells);
        setMessage(`+${result.points} ${result.word} collected!`);

        setUser((value) => ({
          ...value,
          words: value.words + 1,
        }));

        window.setTimeout(() => {
          setNewCells([]);
        }, 450);
      } catch (err) {
        setMessage(err.response?.data?.detail || err.message || "Unable to collect word.");
      }
    }

    collect();
  };

  const running = !paused && seconds > 0 && !loading && !finished;

  const displayMessage = selected.length ? selected.map(([row, col]) => grid[row]?.[col] || "").join("") : message;

  return (
    <div>
      <div className="mb-6 flex flex-row items-end justify-between">
        <div></div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isDaily && (
            <div className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-card p-1">
              {GRID_SIZES.map((size) => {
                const unlocked = highestScore >= GRID_UNLOCK_SCORE[size];
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!unlocked}
                    title={unlocked ? `Play ${size}x${size}` : `Reach ${GRID_UNLOCK_SCORE[size]} score to unlock`}
                    onClick={() => changeGridSize(size)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-black ${
                      gridSize === size
                        ? "bg-brand-accent text-background"
                        : unlocked
                          ? "text-brand-muted hover:text-brand-accent"
                          : "text-brand-muted opacity-40 cursor-not-allowed"
                    }`}
                  >
                    {size}x{size}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-card px-3 py-2.5 text-sm font-bold text-brand-muted"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            disabled={seconds === 0 || loading || finished}
            onClick={() => setPaused((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-accent bg-brand-accent/10 px-3 py-2.5 text-sm font-bold text-brand-accent"
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-fit items-start gap-5">
        <div className="w-[350px] space-y-5">
          <WordList words={found} />

          <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <GameStat label="Time" value={`${seconds}s`} icon={Clock3} />

              <GameStat label="Score" value={score} icon={Zap} accent="brand-tertiary" />

              <GameStat label="Grid" value={`${gridSize}x${gridSize}`} icon={Trophy} />

              <GameStat label="Found" value={found.length} icon={Trophy} accent="brand-pink" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-brand-border bg-brand-card p-4">
            <p className="text-center text-sm font-medium leading-6 text-brand-muted sm:text-base">
              Drag through any adjacent letters. Move horizontally, vertically, diagonally, and change direction as many times as you want.
            </p>
          </div>
        </div>

        <div className="w-[700px] rounded-3xl border border-brand-border bg-brand-card p-3 sm:p-5">
          <div className="mb-5">
            <div className="mt-2 min-h-12 rounded-xl border border-brand-border bg-background p-3 text-center text-lg font-black tracking-wider text-brand-accent">
              {displayMessage}
            </div>
          </div>

          <GameGrid
            grid={grid}
            selected={selected}
            newCells={newCells}
            disabled={!running}
            onStart={handleStart}
            onMove={handleMove}
            onFinish={handleFinish}
          />
        </div>

        <div className="w-[400px] space-y-5"></div>
      </div>
    </div>
  );
}
