
import csv
import json
import math
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

sources = {
    "Marvel": "marvel-wikia-data.csv",
    "DC": "dc-wikia-data.csv"
}

records = []
counts_by_publisher = {
    "Marvel": [],
    "DC": []
}

for publisher, filename in sources.items():
    with open(
        DATA_DIR / filename,
        encoding="utf-8-sig",
        newline=""
    ) as f:

        reader = csv.DictReader(f)

        for row in reader:
            raw = (row.get("APPEARANCES") or "").strip()

            if not raw.isdigit():
                continue

            appearances = int(raw)

            if appearances <= 0:
                continue

            alignment = (
                row.get("ALIGN") or "Unknown"
            ).replace(" Characters", "").strip()

            if alignment not in ["Good", "Bad", "Neutral"]:
                alignment = "Other/Unknown"

            records.append({
                "publisher": publisher,
                "alignment": alignment,
                "group": f"{publisher} · {alignment}",
                "appearances": appearances
            })

            counts_by_publisher[publisher].append(
                appearances
            )

# Calculate cumulative appearance concentration
percentages = [0, 1, 5, 10, 20, 50, 100]

concentration = []

for publisher, counts in counts_by_publisher.items():
    counts.sort(reverse=True)

    total = sum(counts)
    n = len(counts)

    if n == 0 or total == 0:
        raise ValueError(
            f"No valid appearances for {publisher}"
        )

    for pct in percentages:
        k = math.ceil(n * pct / 100)

        share = sum(counts[:k]) / total

        concentration.append({
            "publisher": publisher,
            "top_pct": pct,
            "share": share,
            "characters": k
        })

# Export compact JSON
outputs = {
    "appearance_records.json": records,
    "appearance_concentration.json": concentration
}

for filename, data in outputs.items():
    path = DATA_DIR / filename

    with open(path, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            separators=(",", ":")
        )

    print(
        f"{filename}: {len(data)} records, "
        f"{path.stat().st_size / 1024:.1f} KB"
    )

print("Appearance datasets created successfully.")
