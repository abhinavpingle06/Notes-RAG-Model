import os
import json
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# Load environment
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

# Connect to Qdrant
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

collection_name = "golden_dataset"
output_file = BASE_DIR / "golden_dataset.json"

all_points = []
offset = None
batch_size = 100

try:
    while True:
        points, next_offset = client.scroll(
            collection_name=collection_name,
            limit=batch_size,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )

        for point in points:
            all_points.append({
                "id": str(point.id),
                "payload": point.payload
            })

        print(f"Retrieved: {len(all_points)}")

        if next_offset is None:
            break

        offset = next_offset

    # Export to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(
            all_points,
            f,
            indent=4,
            ensure_ascii=False
        )

    print(f"\nExport completed!")
    print(f"Total points: {len(all_points)}")
    print(f"Saved at: {output_file}")

finally:
    client.close()