from collections import Counter
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import boto3

AWS_REGION = "ap-south-1"

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
users_table = dynamodb.Table("WordQuestUsers")
games_table = dynamodb.Table("WordQuestGames")
daily_table = dynamodb.Table("WordQuestDaily")

def get_next_game_id(username):
    response = games_table.query(
        KeyConditionExpression="username = :username",
        ExpressionAttributeValues={":username": username},
        ScanIndexForward=False,
        Limit=1
    )

    games = response.get("Items", [])

    if not games:
        return 1

    return int(games[0]["gameId"]) + 1

def get_user(username):
    response = users_table.get_item(Key={"username": username})
    user = response.get("Item")
    if user: 
        return user

    user = {"username": username,"best": 0,"words": 0,"rounds": 0,"streak": 0,}
    users_table.put_item(Item=user)
    return user

def update_user_after_game(username,score,word_count):
    user = get_user(username)
    current_best = int(user.get("best", 0))
    current_words = int(user.get("words", 0))
    current_rounds = int(user.get("rounds", 0))
    new_best = max(current_best,score)

    updated_user = {
        "username": username,
        "best": new_best,
        "words": current_words + word_count,
        "rounds": current_rounds + 1,
        "streak": int(user.get("streak", 0)),
    }

    users_table.put_item(Item=updated_user)
    return updated_user

def save_game(username,game_id, mode, grid_size, score, words, duration,puzzle_id=None):
    word_count = len(words)
    highest_word = ""
    highest_word_score = 0
    lowest_word = ""
    lowest_word_score = 0
    common_word = ""

    if words:
        highest_word = max(words, key=lambda word: len(word))
        highest_word_score = (len(highest_word) * 10)
        lowest_word = min(words, key=lambda word: len(word))
        lowest_word_score = (len(lowest_word) * 10)

    if words:
        counts = Counter(words)
        common_word = counts.most_common(1)[0][0]

    game = {
        "username": username,
        "puzzleId": puzzle_id,
        "gameId": game_id,
        "date": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "gridSize": grid_size,
        "score": score,
        "words": words,
        "wordCount": word_count,
        "highestWord": highest_word,
        "highestWordScore": highest_word_score,
        "lowestWord": lowest_word,
        "lowestWordScore": lowest_word_score,
        "commonWord": common_word,
        "duration": duration,
    }

    games_table.put_item(Item=game)
    update_user_after_game(username,score,word_count)
    return game

def get_game_history(username, limit=None):
    if limit:
        response = games_table.query(
            KeyConditionExpression="username = :username",
            ExpressionAttributeValues={":username": username},
            ScanIndexForward=False,
            Limit=limit
        )
    else:
        response = games_table.query(
            KeyConditionExpression="username = :username",
            ExpressionAttributeValues={":username": username}
        )
    
    games = response.get("Items", [])
    games.sort(key=lambda game: game.get("date", ""), reverse=True)
    return games

def get_history_with_difficulty(username):
    history = get_game_history(username, 10)
    for game in history:
        game["difficulty"] = calculate_difficulty(username,game.get("wordCount", 0))
    return history

def calculate_difficulty(username, words):
    history = get_game_history(username,10)
    if not history:
        return 50

    total_words = 0
    for game in history:
        total_words += int(game.get("wordCount", 0))

    average = total_words / len(history)
    if average <= 0:
        return 50
    
    words = int(words)
    difference = words - average
    difficulty = 50 - (difference * 5)
    difficulty = max(0, min(100, difficulty))
    return round(difficulty)

def get_leaderboard():
    response = users_table.scan()
    leaderboard = []
    users = response.get("Items",[])
    users.sort(key=lambda user: int(user.get("best",0)), reverse=True)

    for position, user in enumerate(users,start=1):
        leaderboard.append({
            "position": position,
            "username": user.get("username", ""),
            "best": int(user.get("best", 0)),
            "words": int(user.get("words", 0)),
            "rounds": int(user.get("rounds", 0)),
        })
    return leaderboard

def get_daily_puzzle():
    today = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y%m%d")
    puzzle_id = int(today)
    response = daily_table.get_item(Key={"puzzleId": puzzle_id})
    return response.get("Item")