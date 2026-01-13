import pandas as pd
import requests
import os
import json
from io import StringIO

# スプレッドシートの設定
# デフォルト値として提供されたIDを設定していますが、Secretsに登録がある場合はそちらが優先されます
SHEET_ID = os.environ.get('SHEET_ID', '1cG37dxatVK7go9rDvu4VMrp1XN4qCvgbVyyiqHqLBy0')

# 【重要】取得するシート(タブ)とGIDの定義
# ブラウザでスプレッドシートの各タブを開き、URL末尾の gid= の後の数字を正確に入力してください。
# 例: https://docs.google.com/spreadsheets/d/.../edit#gid=1234567
SHEETS_CONFIG = {
    "pilots": "0",         # 通常、最初のシートは 0 です
    "mechs": "123456789",   # 実際のGIDに書き換えてください（例: 7482910）
    "weapons": "987654321"  # 実際のGIDに書き換えてください
}

def fetch_csv(sheet_id, gid):
    # 公開されているスプレッドシートをCSVとしてエクスポートするURL
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Failed to fetch GID {gid}: {e}")
        return None

def main():
    output_path = 'public/data'
    os.makedirs(output_path, exist_ok=True)
    
    db_full = {}

    for key, gid in SHEETS_CONFIG.items():
        print(f"--- Processing {key} (GID: {gid}) ---")
        csv_text = fetch_csv(SHEET_ID, gid)
        
        if csv_text:
            # CSVを読み込み、完全に空の行を除去
            df = pd.read_csv(StringIO(csv_text))
            df = df.dropna(how='all').fillna("")
            
            # データが存在するか確認
            if len(df) == 0:
                print(f"Warning: No data found for {key}. Check if the sheet is empty or GID is correct.")
            else:
                print(f"Success: Found {len(df)} records for {key}.")
            
            records = df.to_dict(orient='records')
            db_full[key] = records
            
            # 個別JSON
            with open(f'{output_path}/{key}.json', 'w', encoding='utf-8') as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
        else:
            print(f"Error: Could not retrieve data for {key}. Skipping.")
            db_full[key] = []
    
    # 全データを統合
    with open(f'{output_path}/db.json', 'w', encoding='utf-8') as f:
        json.dump(db_full, f, ensure_ascii=False, indent=2)
    
    print("--- Database sync finished ---")

if __name__ == "__main__":
    main()
