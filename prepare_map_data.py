
import csv
import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

input_file = DATA_DIR / "publishers_wikidata.csv"

countries = {}
locations = {}

with open(input_file, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)

    for row in reader:

        publisher_id = row["publisher"].split("/")[-1]
        publisher_name = row["publisherLabel"]
        country_name = row["countryLabel"]
        iso = row["iso"].strip()

        if not publisher_id or not iso.isdigit():
            continue

        # Group publishers by country
        if iso not in countries:
            countries[iso] = {
                "country": country_name,
                "ids": set()
            }

        countries[iso]["ids"].add(publisher_id)

        # Extract headquarters-city coordinates
        coordinate_text = row.get("coordinates", "")

        match = re.search(
            r"Point\(([-\d.]+)\s+([-\d.]+)\)",
            coordinate_text
        )

        if match:
            longitude = float(match.group(1))
            latitude = float(match.group(2))

            if (
                -180 <= longitude <= 180
                and -90 <= latitude <= 90
            ):
                locations[publisher_id] = {
                    "publisher": publisher_name,
                    "publisher_id": publisher_id,
                    "country": country_name,
                    "city": row.get("hqLabel", ""),
                    "longitude": longitude,
                    "latitude": latitude
                }

# Count unique publisher records by country
country_data = []

for iso, info in countries.items():
    country_data.append({
        "iso_numeric": int(iso),
        "country": info["country"],
        "publishers": len(info["ids"])
    })

country_data.sort(
    key=lambda x: x["publishers"],
    reverse=True
)

location_data = list(locations.values())

if not country_data:
    raise RuntimeError(
        "No valid country records found. "
        "Check the downloaded Wikidata CSV."
    )

# Save both JSON files
with open(
    DATA_DIR / "publisher_countries.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(country_data, f, indent=2)

with open(
    DATA_DIR / "publisher_locations.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(location_data, f, indent=2)

print("Countries:", len(country_data))
print("Geolocated publishers:", len(location_data))
print("Map datasets created successfully.")
