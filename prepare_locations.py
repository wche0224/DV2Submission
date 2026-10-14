
import csv
import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

INPUT_FILE = DATA_DIR / "publisher_locations_wikidata.csv"
OUTPUT_FILE = DATA_DIR / "publisher_locations.json"

# Match Wikidata's Point(longitude latitude)
pattern = re.compile(
    r"Point\(\s*(-?\d+(?:\.\d+)?)"
    r"\s+(-?\d+(?:\.\d+)?)\s*\)"
)

locations = {}

with open(INPUT_FILE, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)

    required = {
        "publisher", "publisherLabel",
        "hq", "hqLabel", "coordinates"
    }

    if not required.issubset(reader.fieldnames or []):
        raise ValueError(
            f"Missing CSV columns: "
            f"{required - set(reader.fieldnames or [])}"
        )

    for row in reader:

        publisher_id = row["publisher"].split("/")[-1]
        headquarters_id = row["hq"].split("/")[-1]

        coordinates = row["coordinates"]

        match = pattern.search(coordinates)

        if not match:
            continue

        longitude = float(match.group(1))
        latitude = float(match.group(2))

        if not (
            -180 <= longitude <= 180
            and -90 <= latitude <= 90
        ):
            continue

        if headquarters_id not in locations:
            locations[headquarters_id] = {
                "city": row["hqLabel"],
                "headquarters_id": headquarters_id,
                "longitude": longitude,
                "latitude": latitude,
                "publisher_ids": set()
            }

        locations[headquarters_id]["publisher_ids"].add(
            publisher_id
        )

# Convert the grouped data to JSON records
result = []

for location in locations.values():
    result.append({
        "city": location["city"],
        "headquarters_id": location["headquarters_id"],
        "longitude": location["longitude"],
        "latitude": location["latitude"],
        "publishers": len(location["publisher_ids"])
    })

result.sort(
    key=lambda x: x["publishers"],
    reverse=True
)

if not result:
    raise RuntimeError(
        "No valid headquarters coordinates found. "
        "Check the Wikidata CSV."
    )

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f"Headquarters locations: {len(result)}")
print(
    "Publisher-location records:",
    sum(item["publishers"] for item in result)
)
print(f"Created: {OUTPUT_FILE.name}")
