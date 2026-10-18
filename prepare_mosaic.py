
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

INPUT_FILE = DATA_DIR / "alignment_by_decade.json"
OUTPUT_FILE = DATA_DIR / "publisher_alignment_mosaic.json"

PUBLISHERS = ["Marvel", "DC"]

ALIGNMENTS = [
    "Good",
    "Bad",
    "Neutral",
    "Other / unknown"
]

with open(INPUT_FILE, encoding="utf-8") as f:
    records = json.load(f)

# Initialise publisher and alignment counts
counts = {
    publisher: {alignment: 0 for alignment in ALIGNMENTS}
    for publisher in PUBLISHERS
}

# Aggregate character entries across decades
for row in records:
    publisher = row.get("publisher")

    if publisher not in PUBLISHERS:
        continue

    count = int(row.get("characters", 0))

    if count < 0:
        raise ValueError("Negative character count found")

    alignment = str(
        row.get("alignment") or "Unknown"
    ).strip()

    if alignment not in ["Good", "Bad", "Neutral"]:
        alignment = "Other / unknown"

    counts[publisher][alignment] += count

# Total entries belonging to each publisher
publisher_totals = {
    publisher: sum(counts[publisher].values())
    for publisher in PUBLISHERS
}

grand_total = sum(publisher_totals.values())

if any(total == 0 for total in publisher_totals.values()):
    raise ValueError("A publisher has no valid records")

result = []
x_start = 0.0

for publisher in PUBLISHERS:
    publisher_total = publisher_totals[publisher]

    # Width proportional to total character entries
    publisher_width = publisher_total / grand_total

    x_end = x_start + publisher_width
    y_start = 0.0

    for alignment in ALIGNMENTS:
        count = counts[publisher][alignment]

        # Height proportional to alignment share
        share = count / publisher_total
        y_end = y_start + share

        result.append({
            "publisher": publisher,
            "alignment": alignment,
            "characters": count,
            "publisher_total": publisher_total,
            "within_publisher_share": share,
            "overall_share": count / grand_total,
            "x0": x_start,
            "x1": x_end,
            "y0": y_start,
            "y1": y_end,
            "mid_x": (x_start + x_end) / 2
        })

        y_start = y_end

    x_start = x_end

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("Created:", OUTPUT_FILE.name)
print("Marvel entries:", publisher_totals["Marvel"])
print("DC entries:", publisher_totals["DC"])
print("Total:", grand_total)
