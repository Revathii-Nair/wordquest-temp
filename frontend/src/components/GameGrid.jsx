import { useRef } from "react";

export default function GameGrid({ grid, selected, newCells, disabled, onStart, onMove, onFinish }) {
  const boardRef = useRef(null);
  const dragging = useRef(false);
  const cols = grid[0]?.length || 0;

  const isSelected = (row, col) => {
    return selected.some(([r, c]) => r === row && c === col);
  };

  const isNew = (row, col) => {
    return newCells.some(([r, c]) => r === row && c === col);
  };

  const getCell = (x, y) => {
    const element = document.elementFromPoint(x, y);
    const cell = element?.closest("[data-grid-cell]");

    if (!cell || !boardRef.current?.contains(cell)) return null;
    return [Number(cell.dataset.row), Number(cell.dataset.col)];
  };

  const handlePointerDown = (event, row, col) => {
    if (disabled) return;

    event.preventDefault();
    dragging.current = true;

    onStart([row, col]);
  };

  const handlePointerMove = (event) => {
    if (!dragging.current || disabled) return;
    const cell = getCell(event.clientX, event.clientY);

    if (cell) {
      onMove(cell);
    }
  };

  const handlePointerUp = (event) => {
    if (!dragging.current) return;

    event.preventDefault();
    const cell = getCell(event.clientX, event.clientY);

    if (cell) {
      onMove(cell);
    }

    dragging.current = false;
    onFinish();
  };

  const handlePointerCancel = () => {
    dragging.current = false;
    onFinish();
  };

  return (
    <div className="mx-auto w-full max-w-[650px] rounded-2xl border border-brand-border bg-background p-1.5 select-none sm:p-2">
      <div
        ref={boardRef}
        className="grid w-full gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {grid.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const selectedCell = isSelected(rowIndex, colIndex);
            const newCell = isNew(rowIndex, colIndex);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                disabled={disabled}
                data-grid-cell
                data-row={rowIndex}
                data-col={colIndex}
                onPointerDown={(event) => handlePointerDown(event, rowIndex, colIndex)}
                className={`relative m-1 aspect-square rounded-[5px] border font-black transition text-2xl sm:text-3xl ${
                  selectedCell
                    ? "border-brand-tertiary bg-brand-tertiary text-background shadow-lg"
                    : "border-brand-border bg-brand-card text-cell-text hover:border-brand-accent"
                } ${newCell ? "animate-fall-in" : ""}`}
              >
                {letter}

                {newCell && <span className="absolute inset-x-0 bottom-0 h-1 bg-brand-accent" />}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
