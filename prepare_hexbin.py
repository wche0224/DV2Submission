
import json
import math
from pathlib import Path
from collections import defaultdict
from pyproj import CRS, Transformer

DATA_DIR = Path(__file__).parent / "data"

INPUT_FILE = DATA_DIR / "publisher_locations.json"
OUTPUT_FILE = DATA_DIR / "publisher_hexbins.geojson"

# Hexagon radius in metres
RADIUS = 500000

# Use an equal-area projection for binning
mollweide = CRS.from_proj4(
    "+proj=moll +lon_0=0 +datum=WGS84 "
    "+units=m +no_defs +type=crs"
)

forward = Transformer.from_crs(
    "EPSG:4326", mollweide, always_xy=True
)

reverse = Transformer.from_crs(
    mollweide, "EPSG:4326", always_xy=True
)

# Convert projected coordinates to hex grid
def hex_round(q, r):
    x = q
    z = r
    y = -x - z

    rx, ry, rz = round(x), round(y), round(z)

    dx = abs(rx - x)
    dy = abs(ry - y)
    dz = abs(rz - z)

    if dx > dy and dx > dz:
        rx = -ry - rz
    elif dy > dz:
        ry = -rx - rz
    else:
        rz = -rx - ry

    return rx, rz


def get_hex(longitude, latitude):
    x, y = forward.transform(longitude, latitude)

    q = (
        math.sqrt(3) / 3 * x - y / 3
    ) / RADIUS

    r = (2 * y / 3) / RADIUS

    return hex_round(q, r)


def create_polygon(q, r):
    center_x = RADIUS * math.sqrt(3) * (
        q + r / 2
    )
    center_y = RADIUS * 1.5 * r

    coordinates = []

    for i in range(6):
        # Vega/D3 expects clockwise exterior rings for small polygons.
        angle = math.radians(-60 * i - 30)

        x = center_x + RADIUS * math.cos(angle)
        y = center_y + RADIUS * math.sin(angle)

        longitude, latitude = reverse.transform(x, y)

        coordinates.append([longitude, latitude])

    coordinates.append(coordinates[0])
    return coordinates


# Read locations
with open(INPUT_FILE, encoding="utf-8") as f:
    locations = json.load(f)

bins = defaultdict(
    lambda: {"publishers": 0, "locations": 0}
)

for location in locations:
    longitude = float(location["longitude"])
    latitude = float(location["latitude"])
    count = int(location["publishers"])

    if not (
        math.isfinite(longitude)
        and math.isfinite(latitude)
        and -180 <= longitude <= 180
        and -90 <= latitude <= 90
        and count > 0
    ):
        continue

    cell = get_hex(longitude, latitude)

    bins[cell]["publishers"] += count
    bins[cell]["locations"] += 1

features = []

for (q, r), values in bins.items():
    polygon = create_polygon(q, r)

    features.append({
        "type": "Feature",
        "properties": {
            "publishers": values["publishers"],
            "locations": values["locations"]
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [polygon]
        }
    })

geojson = {
    "type": "FeatureCollection",
    "features": features
}

if not features:
    raise RuntimeError("No valid hexagons generated.")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(geojson, f, indent=2)

print("Headquarters rows:", len(locations))
print("Hexagonal regions:", len(features))
print("Created:", OUTPUT_FILE.name)

if len(locations) < 30:
    print(
        "WARNING: Sparse headquarters data. "
        "Check coverage before making density claims."
    )
