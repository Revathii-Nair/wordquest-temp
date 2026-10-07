import boto3

S3_BUCKET = "wordquest-bucket-961864443815-ap-south-1-an"
FILE_NAME = "popular.txt"

s3 = boto3.client("s3", region_name="ap-south-1")

response = s3.get_object(Bucket=S3_BUCKET, Key=FILE_NAME)
content = response["Body"].read().decode("utf-8")

WORD_BANK = set()

for line in content.splitlines():
    cleaned = line.strip()
    if cleaned:
        WORD_BANK.add(cleaned.upper())

LETTERS = list("EEEEEEEEEEEEAAAAAAAAAAIIIIIIIIIIOOOOOOOOOUUUUUUNNNNNNRRRRRRTTTTTTLLLLLLSSSSSSDDDDDGGGGGMMMMMPPPPCCCCBBBBHHHHFFFVVVWWYYKKJJXXQQZZ")