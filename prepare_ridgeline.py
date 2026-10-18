
import json
import math
import statistics
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent / "data"

INPUT = DATA_DIR / "appearance_records.json"

with open(INPUT, encoding="utf-8") as f:
    records = json.load(f)

publishers = ["Marvel", "DC"]
alignments = ["Good", "Bad", "Neutral"]

groups = defaultdict(list)

# Group valid appearance counts
for row in records:
    publisher = row.get("publisher")
    alignment = row.get("alignment")
    count = int(row.get("appearances", 0))

    if (
        publisher in publishers
        and alignment in alignments
        and count > 0
    ):
        groups[(publisher, alignment)].append(count)

group_order = [
    (publisher, alignment)
    for publisher in publishers
    for alignment in alignments
]

# Check all six groups exist
for group in group_order:
    if len(groups[group]) < 10:
        raise ValueError(
            f"Not enough observations for {group}"
        )

# Common horizontal axis in log10 space
max_appearance = max(
    max(groups[group]) for group in group_order
)

max_x = max(
    4, math.ceil(math.log10(max_appearance))
)

steps = 121

x_values = [
    max_x * i / (steps - 1)
    for i in range(steps)
]

# Gaussian kernel density estimation
def calculate_density(values):
    n = len(values)
    std = statistics.pstdev(values)

    # Bandwidth with limits for readability
    bandwidth = min(
        0.35,
        max(0.14, 1.06 * std * n ** (-0.2))
    )

    normalizer = (
        n * bandwidth * math.sqrt(2 * math.pi)
    )

    densities = []

    for x in x_values:
        total = sum(
            math.exp(
                -0.5 * ((x - value) / bandwidth) ** 2
            )
            for value in values
        )

        densities.append(total / normalizer)

    return densities

density_by_group = {}
summary = []

for group in group_order:
    counts = groups[group]

    log_values = [
        math.log10(count) for count in counts
    ]

    density_by_group[group] = calculate_density(
        log_values
    )

    summary.append({
        "publisher": group[0],
        "alignment": group[1],
        "records": len(counts),
        "one_appearance": sum(
            count == 1 for count in counts
        ),
        "median": statistics.median(counts)
    })

# Use one common density scale for every group
global_peak = max(
    max(values)
    for values in density_by_group.values()
)

result = []

for index, group in enumerate(group_order):
    publisher, alignment = group
    baseline = 6 - index

    group_summary = summary[index]

    for x, density in zip(
        x_values,
        density_by_group[group]
    ):
        result.append({
            "group": f"{publisher} · {alignment}",
            "publisher": publisher,
            "alignment": alignment,
            "log_appearances": round(x, 4),
            "approx_appearances": round(10 ** x),
            "baseline": baseline,
            "ridge_top": round(
                baseline + 1.3 * density / global_peak,
                5
            ),
            "records": group_summary["records"],
            "median": group_summary["median"]
        })

# Save compact datasets
outputs = {
    "appearance_ridgeline.json": result,
    "appearance_ridgeline_summary.json": summary
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

print("Ridgeline datasets created successfully.")
