from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV = BASE_DIR.parent
ENV_PATH = ENV / ".env"
files_path = BASE_DIR / "pdfs"
directory = Path(files_path)

for item in directory.iterdir():
  if item.is_file():
    print(item.name)  # Prints just the filename (e.g., "data.csv")