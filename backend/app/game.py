import random
from .words import (LETTERS,WORD_BANK)

GRID_SIZES = [5, 6, 7, 8, 9]
DEFAULT_GRID_SIZE = 5

class GameState:
    def __init__(self,grid,score=0,found=None):
        self.grid = grid
        self.score = score
        self.found = found or []


def make_grid(rows, cols):
    grid = []
    for _ in range(rows):
        row = []
        for _ in range(cols):
            row.append(random.choice(LETTERS))
        grid.append(row)
    return grid


def new_game(grid_size=DEFAULT_GRID_SIZE):
    return GameState( make_grid(grid_size, grid_size))


def get_word_from_cells(grid, cells):
    word = ""
    for row, col in cells:
        word += grid[row][col]
    return word


def is_adjacent(previous, current):
    row_distance = abs(current[0] - previous[0])
    column_distance = abs(current[1] - previous[1])
    if row_distance <= 1 and column_distance <= 1:
        return not (row_distance == 0 and column_distance == 0)
    return False


def validate_cells(grid, cells):
    if not grid or len(cells) < 3:
        return None

    rows, cols = len(grid), len(grid[0])
    previous = None

    for row, col in cells:
        if row < 0 or row >= rows or col < 0 or col >= cols:
            return None
        current = (row, col)
        if previous and not is_adjacent(previous, current):
            return None
        previous = current

    return get_word_from_cells(grid, cells)


def is_word(word):
    upper = word.upper()
    if upper in WORD_BANK:
        return upper
    reverse = upper[::-1]
    if reverse in WORD_BANK:
        return reverse
    return None

def replace_cells(grid, cells):
    next_grid = [row[:] for row in grid]
    new_cells = []

    for row, col in cells:
        next_grid[row][col] = random.choice(LETTERS)
        new_cells.append([row, col])

    return next_grid, new_cells

def collect_word(state, cells):
    raw = validate_cells(state.grid, cells)
    if not raw:
        return {
            "accepted": False,
            "validation": {"reason": "Select at least 3 adjacent letters."},
            "grid": state.grid,
            "score": state.score,
            "found": state.found,
            "newCells": [],
        }

    word = is_word(raw)
    if not word:
        return {
            "accepted": False,
            "validation": {"reason": f"{raw} is not a word."},
            "grid": state.grid,
            "score": state.score,
            "found": state.found,
            "newCells": [],
        }

    points = len(word) * 10
    new_grid, new_cells = replace_cells(state.grid, cells)

    state.grid = new_grid
    state.score += points
    state.found.append(word)

    return {
        "accepted": True,
        "word": word,
        "points": points,
        "grid": state.grid,
        "score": state.score,
        "found": state.found,
        "newCells": new_cells,
    }
