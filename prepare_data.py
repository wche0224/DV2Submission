
import csv
import json
from pathlib import Path
from collections import Counter

# Locate the data folder
DATA_DIR = Path(__file__).parent / "data"

# Input datasets
sources = [
    ("Marvel", "marvel-wikia-data.csv", "Year"),
    ("DC", "dc-wikia-data.csv", "YEAR")
]

debut_counts = Counter()
alignment_counts = Counter()
characters = []

# Read both CSV files
for publisher, filename, year_column in sources:
    filepath = DATA_DIR / filename

    with open(filepath, encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            year_text = (row.get(year_column) or "").strip()
            appearances_text = (
                row.get("APPEARANCES") or ""
            ).strip()

            # Process known debut years
            if year_text.isdigit():
                year = int(year_text)

                if 1930 <= year <= 2014:
                    decade = (year // 10) * 10

                    debut_counts[(publisher, decade)] += 1

                    alignment = (
                        row.get("ALIGN") or "Unknown"
                    ).replace(" Characters", "")

                    alignment_counts[
                        (publisher, decade, alignment)
                    ] += 1

            # Process known appearance counts
            if appearances_text.isdigit():
                characters.append({
                    "publisher": publisher,
                    "name": row["name"],
                    "appearances": int(appearances_text)
                })

# Convert aggregated results into JSON records
debuts = [
    {
        "publisher": publisher,
        "decade": decade,
        "characters": count
    }
    for (publisher, decade), count
    in sorted(debut_counts.items())
]

alignments = [
    {
        "publisher": publisher,
        "decade": decade,
        "alignment": alignment,
        "characters": count
    }
    for (publisher, decade, alignment), count
    in sorted(alignment_counts.items())
]

# Select the top 30 entries from each publisher
top_characters = []

for publisher in ["Marvel", "DC"]:
    selected = [
        character for character in characters
        if character["publisher"] == publisher
    ]

    selected.sort(
        key=lambda item: item["appearances"],
        reverse=True
    )

    top_characters.extend(selected[:30])

# Save the processed files
outputs = {
    "debuts_by_decade.json": debuts,
    "alignment_by_decade.json": alignments,
    "top_characters.json": top_characters
}

for filename, records in outputs.items():
    output_path = DATA_DIR / filename

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(records, file, indent=2, ensure_ascii=False)

    print(f"Created {filename}: {len(records)} records")
