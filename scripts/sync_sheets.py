import pandas as pd
import requests
import os
import json
from io import StringIO

# Configuration
SHEET_ID = os.environ.get('SHEET_ID', '1cG37dxatVK7go9rDvu4VMrp1XN4qCvgbVyyiqHqLBy0')

# Define sheet names and their corresponding GIDs
# You should update these GIDs based on your specific spreadsheet tabs
SHEETS_CONFIG = {
    "pilots": "0",         # Default first sheet
    "mechs": "123456789",   # Placeholder GID
    "weapons": "987654321"  # Placeholder GID
}

def fetch_sheet(sheet_id, gid):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching GID {gid}: {e}")
        return None

def main():
    output_dir = 'public/data'
    os.makedirs(output_dir, exist_ok=True)
    
    db_aggregated = {}

    for key, gid in SHEETS_CONFIG.items():
        print(f"Processing {key} (GID: {gid})...")
        csv_data = fetch_sheet(SHEET_ID, gid)
        
        if csv_data:
            df = pd.read_csv(StringIO(csv_data))
            # Clean data: remove empty rows/columns and fill NaN
            df = df.dropna(how='all').fillna("")
            
            records = df.to_dict(orient='records')
            db_aggregated[key] = records
            
            # Save individual JSON
            with open(f'{output_dir}/{key}.json', 'w', encoding='utf-8') as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
    
    # Save combined database
    with open(f'{output_dir}/db.json', 'w', encoding='utf-8') as f:
        json.dump(db_aggregated, f, ensure_ascii=False, indent=2)
    
    print("Database sync completed successfully.")

if __name__ == "__main__":
    main()
