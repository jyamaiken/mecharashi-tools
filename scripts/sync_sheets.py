import pandas as pd
import requests
import os
import json
import re
from io import StringIO

# ==========================================
# 設定エリア
# ==========================================

SHEET_ID = os.environ.get('SHEET_ID', '1cG37dxatVK7go9rDvu4VMrp1XN4qCvgbVyyiqHqLBy0')

FALLBACK_SHEETS = {
    "キャラST": "401271395",
    "予定": "1955477458",
    "キャラ訳": "347170430",
    "ST": "1007690338",
    "武器": "122249602",
    "コア": "838155022",
    "ユニット": "1191652583",
    "強敵": "1085841251",
    "他リンク": "1438940995",
    "編集中": "1725386654"
}

# ==========================================
# 処理エリア
# ==========================================

def sanitize_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def get_all_sheets_metadata(sheet_id):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
    sheets = {}
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        # メタデータ取得時もUTF-8を指定
        content = response.content.decode('utf-8')
        
        matches = re.findall(r'\[(\d+),"([^"]+)",(?:null|true|false|0),', content)
        for gid, name in matches:
            if name and gid not in sheets.values():
                sheets[name] = gid
        if not sheets:
            matches = re.findall(r'\{"1":"([^"]+)","2":(\d+)', content)
            for name, gid in matches:
                sheets[name] = gid
        return sheets
    except Exception as e:
        print(f"メタデータ自動取得失敗: {e}")
        return {}

def fetch_csv(sheet_id, gid):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        # 【重要】文字化け対策: response.textの代わりにcontentを明示的にutf-8でデコード
        return response.content.decode('utf-8')
    except Exception as e:
        print(f"!!! GID {gid} のCSV取得エラー: {e}")
        return None

def main():
    output_path = 'public/data'
    os.makedirs(output_path, exist_ok=True)
    
    print(f"ターゲット Sheet ID: {SHEET_ID}")
    discovered = get_all_sheets_metadata(SHEET_ID)
    final_sheets = {**FALLBACK_SHEETS, **discovered}
    
    db_full = {}
    valid_count = 0

    for name, gid in final_sheets.items():
        safe_name = sanitize_filename(name)
        print(f"--- 取得中: {name} (GID: {gid}) ---")
        
        csv_text = fetch_csv(SHEET_ID, gid)
        
        if csv_text and len(csv_text.strip()) > 0:
            try:
                # Pandas読み込み時も明示的にutf-8を想定
                df = pd.read_csv(StringIO(csv_text), encoding='utf-8')
                df = df.dropna(how='all').fillna("")
                
                if len(df) > 0:
                    records = df.to_dict(orient='records')
                    db_full[name] = records
                    
                    with open(f'{output_path}/{safe_name}.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    
                    print(f"成功: {len(df)} 件取得")
                    valid_count += 1
                else:
                    db_full[name] = []
            except Exception as e:
                print(f"解析失敗 ({name}): {e}")
                db_full[name] = []
        else:
            db_full[name] = []
        
    if valid_count > 0:
        with open(f'{output_path}/db.json', 'w', encoding='utf-8') as f:
            json.dump(db_full, f, ensure_ascii=False, indent=2)
        print(f"完了: 合計 {valid_count} シートを更新")
    else:
        print("エラー: 有効なデータがありません。")

if __name__ == "__main__":
    main()
