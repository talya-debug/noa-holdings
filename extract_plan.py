# -*- coding: utf-8 -*-
"""
סקריפט חילוץ נתונים מתוכנית בנייה PDF
שלב 1 — חילוץ בסיסי: גיאומטריה + טקסט (OCR) + סיווג אזורים
קלט: קובץ PDF של תוכנית
פלט: קובץ JSON עם כל הנתונים המובנים
"""

import os
import sys
import json
import math
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from collections import Counter, defaultdict
from io import BytesIO

# הגדרות Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:\Users\LENOVO\tessdata'

# === פונקציות עזר ===

def color_name(c):
    """מזהה שם צבע מרכיבי RGB"""
    if not c or len(c) < 3:
        return 'none'
    r, g, b = [round(x, 2) for x in c[:3]]
    if r == g == b:
        if r < 0.15:
            return 'black'
        if r > 0.85:
            return 'white'
        return 'grey'
    if b > 0.7 and r < 0.3 and g < 0.3:
        return 'blue'
    if g > 0.7 and b > 0.7 and r < 0.3:
        return 'cyan'
    if r > 0.7 and g < 0.3 and b < 0.3:
        return 'red'
    if r > 0.7 and g > 0.7 and b < 0.3:
        return 'yellow'
    if r < 0.3 and g > 0.7 and b < 0.3:
        return 'green'
    if r > 0.5 and g < 0.3 and b > 0.5:
        return 'purple'
    if r > 0.7 and g > 0.4 and b < 0.3:
        return 'orange'
    return f'rgb({r:.2f},{g:.2f},{b:.2f})'


def path_bbox(path):
    """מחשב bounding box של path"""
    xs, ys = [], []
    for item in path.get('items', []):
        for pt in item[1:]:
            if hasattr(pt, 'x'):
                xs.append(pt.x)
                ys.append(pt.y)
    if xs and ys:
        return (min(xs), min(ys), max(xs), max(ys))
    return None


def path_length(path):
    """מחשב אורך כולל של path (סכום קטעי קו)"""
    total = 0
    items = path.get('items', [])
    for item in items:
        if item[0] == 'l' and len(item) >= 3:
            p1, p2 = item[1], item[2]
            if hasattr(p1, 'x') and hasattr(p2, 'x'):
                dx = p2.x - p1.x
                dy = p2.y - p1.y
                total += math.sqrt(dx*dx + dy*dy)
    return total


def cluster_points(points, radius=15):
    """מקבץ נקודות קרובות לאשכולות (סמלים)"""
    if not points:
        return []
    clusters = []
    used = set()
    for i, (x, y) in enumerate(points):
        if i in used:
            continue
        cluster = [(x, y)]
        used.add(i)
        for j, (x2, y2) in enumerate(points):
            if j in used:
                continue
            if abs(x2 - x) < radius and abs(y2 - y) < radius:
                cluster.append((x2, y2))
                used.add(j)
        cx = sum(p[0] for p in cluster) / len(cluster)
        cy = sum(p[1] for p in cluster) / len(cluster)
        clusters.append({'x': round(cx, 1), 'y': round(cy, 1), 'paths': len(cluster)})
    return clusters


def ocr_region(page, rect, dpi=250, lang='heb+eng'):
    """מבצע OCR על אזור מסוים בדף"""
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    img_data = pix.tobytes("png")
    img = Image.open(BytesIO(img_data))
    try:
        text = pytesseract.image_to_string(img, lang=lang, config='--psm 6')
        return text.strip()
    except Exception as e:
        return f"[OCR error: {e}]"


def detect_plan_type(ocr_text):
    """מזהה סוג תוכנית מתוך טקסט OCR"""
    text_lower = ocr_text.lower()
    # חשמל
    if any(w in ocr_text for w in ['חשמל', 'מעגלים', 'תאורה', 'שקע', 'גילוי']):
        if any(w in ocr_text for w in ['תאורה', 'גילוי', 'כריזה']):
            return 'electrical-lighting'
        return 'electrical'
    # אדריכלות
    if any(w in ocr_text for w in ['מחיצ', 'דלת', 'בינוי', 'אדריכל']):
        return 'architecture'
    # אינסטלציה
    if any(w in ocr_text for w in ['אינסטלציה', 'ביוב', 'מים', 'צנרת']):
        return 'plumbing'
    # מיזוג
    if any(w in ocr_text for w in ['מיזוג', 'BTU', 'מזגן']):
        return 'hvac'
    # קונסטרוקציה
    if any(w in ocr_text for w in ['קונסטרוקציה', 'יסוד', 'עמוד', 'קורה']):
        return 'structural'
    # חתכים
    if any(w in ocr_text for w in ['חתך', 'section']):
        return 'section'
    # תקרות
    if any(w in ocr_text for w in ['תקרה', 'ceiling']):
        return 'ceiling'
    return 'unknown'


def extract_title_info(title_text):
    """מחלץ מידע מגוש הכותרת של התוכנית"""
    import re
    info = {}
    lines = [l.strip() for l in title_text.split('\n') if l.strip()]

    for line in lines:
        # שם פרויקט
        if 'ספר' in line or 'בנין' in line or 'מגרש' in line:
            info['project'] = line
        # שלב
        if 'שלב' in line:
            match = re.search(r'שלב\s*([אבגד]|[א-ת])', line)
            if match:
                info['stage'] = match.group(1)
        # שם תוכנית
        if 'תכנית' in line or 'תוכנית' in line:
            info['title'] = line
        # מספר תוכנית
        match = re.search(r'E[-_]?\d+', line)
        if match:
            info['plan_number'] = match.group(0)
        # קנה מידה
        match = re.search(r'קנ"מ\s*[:]?\s*1\s*:\s*(\d+)', line)
        if match:
            info['scale'] = f"1:{match.group(1)}"

    return info


def extract_circuit_tables(text):
    """מחלץ טבלאות מעגלים מטקסט OCR של אזור הטבלאות"""
    import re
    tables = []

    # מזהה שמות טבלאות (לוח חשמל E1, E11, E12...)
    table_headers = re.finditer(r'(?:טבלת מעגלים|לוח חשמל)\s*[-—]?\s*(E\d+)', text, re.IGNORECASE)

    for match in table_headers:
        tables.append({
            'panel': match.group(1),
            'position': match.start()
        })

    # מחפש מספרי מעגלים (E1-xx)
    circuits = re.findall(r'(E\d+[-_]\d+)', text)
    circuit_counter = Counter(circuits)

    # מחפש ערכים מספריים בטבלאות (כמויות)
    numbers_in_tables = re.findall(r'\|\s*(\d{1,3})\s*\|', text)

    return {
        'panels_found': [t['panel'] for t in tables],
        'circuits_found': dict(circuit_counter),
        'table_count': len(tables),
    }


def extract_legend_items(text):
    """מחלץ פריטי מקרא מטקסט OCR"""
    items = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # סמלים ידועים בתוכניות חשמל
    electrical_symbols = {
        'ב"ת': 'בית תקע',
        'מ"ז': 'מפסק זעיר',
        'LED': 'תאורת LED',
        'גלאי': 'גלאי אש/עשן',
        'סירינה': 'סירינה',
        'אינטרקום': 'מערכת אינטרקום',
        'רמקול': 'רמקול',
        'מצלמ': 'מצלמת אבטחה',
    }

    for line in lines:
        for symbol, desc in electrical_symbols.items():
            if symbol in line:
                items.append({
                    'symbol': symbol,
                    'description': desc,
                    'line': line[:100]
                })
                break

    # הסרת כפילויות
    seen = set()
    unique = []
    for item in items:
        key = item['symbol']
        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique


def extract_plan(pdf_path, output_dir=None):
    """
    פונקציה ראשית — מחלצת נתונים מתוכנית PDF

    מחזירה dict עם:
    - metadata: שם קובץ, גודל דף, סוג תוכנית
    - geometry: קווים לפי צבע, עובי, אורכים
    - symbols: אשכולות סמלים (נקודות מאור, שקעים וכו')
    - ocr_regions: טקסט שחולץ מאזורים שונים (מקרא, טבלאות, כותרת)
    - statistics: סטטיסטיקות כלליות
    """
    if not os.path.exists(pdf_path):
        print(f"שגיאה: קובץ לא נמצא: {pdf_path}")
        return None

    doc = fitz.open(pdf_path)
    page = doc[0]

    result = {
        'file': os.path.basename(pdf_path),
        'metadata': {},
        'geometry': {},
        'symbols': {},
        'ocr_regions': {},
        'statistics': {}
    }

    # === מטאדאטה ===
    page_w = page.rect.width
    page_h = page.rect.height
    result['metadata'] = {
        'page_size': {'width': round(page_w, 1), 'height': round(page_h, 1)},
        'rotation': page.rotation,
        'mediabox': [round(x, 1) for x in page.mediabox],
    }

    # === חילוץ גיאומטריה ===
    print(f"  מחלץ גיאומטריה...")
    paths = page.get_drawings()
    result['statistics']['total_paths'] = len(paths)

    # מיון לפי צבע
    by_color = defaultdict(list)
    for p in paths:
        cn = color_name(p.get('color'))
        by_color[cn].append(p)

    geometry = {}
    for cn, ps in by_color.items():
        if cn in ('grey', 'white', 'none'):
            # רקע — רק סטטיסטיקות
            geometry[cn] = {'count': len(ps), 'type': 'background'}
            continue

        # קווים צבעוניים — מחשבים אורכים ומיקומים
        lines_data = []
        total_length = 0
        for p in ps:
            bbox = path_bbox(p)
            length = path_length(p)
            width = p.get('width', 0)
            filled = p.get('fill') is not None

            if bbox and length > 0:
                lines_data.append({
                    'bbox': [round(x, 1) for x in bbox],
                    'length_pts': round(length, 1),
                    'width': round(width, 2),
                    'filled': filled,
                    'items': len(p.get('items', []))
                })
                total_length += length
            elif bbox and filled:
                # צורות מלאות (סמלים, טקסט)
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                lines_data.append({
                    'bbox': [round(x, 1) for x in bbox],
                    'size': [round(w, 1), round(h, 1)],
                    'filled': True,
                    'items': len(p.get('items', []))
                })

        geometry[cn] = {
            'count': len(ps),
            'total_length_pts': round(total_length, 1),
            'details': lines_data[:100]  # מגבילים ל-100 לגודל סביר
        }

    result['geometry'] = geometry

    # === זיהוי סמלים ===
    print(f"  מזהה סמלים...")
    # סמלים = אשכולות של paths קטנים בצבע ספציפי
    for cn in ['black', 'blue', 'cyan', 'red', 'green']:
        if cn not in by_color:
            continue

        # מוצא מרכזי paths קטנים (סמלים, לא קווים ארוכים)
        centers = []
        for p in by_color[cn]:
            bbox = path_bbox(p)
            if bbox:
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                if w < 30 and h < 30 and p.get('fill') is not None:
                    cx = (bbox[0] + bbox[2]) / 2
                    cy = (bbox[1] + bbox[3]) / 2
                    centers.append((cx, cy))

        if centers:
            clusters = cluster_points(centers, radius=20)
            result['symbols'][cn] = {
                'small_filled_paths': len(centers),
                'clusters': len(clusters),
                'sample_positions': clusters[:50]
            }

    # === OCR אזורים ===
    print(f"  מבצע OCR...")

    # חלוקת הדף ל-6 אזורים (מפורט יותר, DPI גבוה לטבלאות)
    regions = {
        'title_block': (fitz.Rect(page_w * 0.85, page_h * 0.7, page_w, page_h), 300),
        'legend_tables_top': (fitz.Rect(page_w * 0.75, 0, page_w, page_h * 0.35), 300),
        'legend_tables_mid': (fitz.Rect(page_w * 0.75, page_h * 0.35, page_w, page_h * 0.7), 300),
        'legend_symbols': (fitz.Rect(page_w * 0.75, page_h * 0.7, page_w * 0.85, page_h), 300),
        'plan_right': (fitz.Rect(page_w * 0.4, 0, page_w * 0.75, page_h), 200),
        'plan_left': (fitz.Rect(page_w * 0.1, 0, page_w * 0.4, page_h), 200),
    }

    ocr_results = {}
    for region_name, (rect, dpi) in regions.items():
        text = ocr_region(page, rect, dpi=dpi)
        if text and len(text) > 10:
            ocr_results[region_name] = {
                'text': text[:5000],
                'char_count': len(text),
                'rect': [round(x, 1) for x in rect]
            }

    result['ocr_regions'] = ocr_results

    # === זיהוי סוג תוכנית ===
    all_text = ' '.join(r.get('text', '') for r in ocr_results.values())
    plan_type = detect_plan_type(all_text)
    result['metadata']['plan_type'] = plan_type
    result['metadata']['plan_type_confidence'] = 'detected'

    # === חילוץ קנה מידה ===
    scale_candidates = []
    import re
    scale_pattern = r'1\s*:\s*(\d+)'
    for match in re.finditer(scale_pattern, all_text):
        scale_candidates.append(int(match.group(1)))
    if scale_candidates:
        result['metadata']['scale'] = f"1:{min(scale_candidates)}"

    # === חילוץ כותרת תוכנית ===
    title_text = ocr_results.get('title_block', {}).get('text', '')
    title_info = extract_title_info(title_text)
    if title_info:
        result['metadata'].update(title_info)

    # === חילוץ טבלאות מעגלים (לחשמל) ===
    if plan_type and 'electrical' in plan_type:
        tables_text = ''
        for key in ['legend_tables_top', 'legend_tables_mid']:
            tables_text += ocr_results.get(key, {}).get('text', '') + '\n'
        circuit_tables = extract_circuit_tables(tables_text)
        if circuit_tables:
            result['circuit_tables'] = circuit_tables

    # === חילוץ מקרא סמלים ===
    symbols_text = ocr_results.get('legend_symbols', {}).get('text', '')
    legend_items = extract_legend_items(symbols_text + '\n' + title_text)
    if legend_items:
        result['legend'] = legend_items

    # === סטטיסטיקות ===
    result['statistics'].update({
        'paths_by_color': {cn: len(ps) for cn, ps in by_color.items()},
        'ocr_regions_found': list(ocr_results.keys()),
        'total_ocr_chars': sum(r.get('char_count', 0) for r in ocr_results.values()),
    })

    # === שמירת תמונות אזורים ===
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]

        # שומר תמונה של כל אזור
        for region_name, (rect, dpi) in regions.items():
            mat = fitz.Matrix(150 / 72, 150 / 72)
            pix = page.get_pixmap(matrix=mat, clip=rect)
            img_path = os.path.join(output_dir, f'{base_name}-{region_name}.png')
            pix.save(img_path)

        # שומר JSON
        json_path = os.path.join(output_dir, f'{base_name}-extracted.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"  נשמר: {json_path}")

    doc.close()
    return result


def print_summary(result):
    """מדפיס סיכום קריא של התוצאות"""
    if not result:
        return

    print(f"\n{'='*60}")
    print(f"קובץ: {result['file']}")
    print(f"סוג תוכנית: {result['metadata'].get('plan_type', '?')}")
    print(f"קנה מידה: {result['metadata'].get('scale', '?')}")
    print(f"גודל דף: {result['metadata']['page_size']}")
    print(f"סיבוב: {result['metadata']['rotation']}°")

    print(f"\n--- גיאומטריה ---")
    for cn, data in result['geometry'].items():
        if data.get('type') == 'background':
            print(f"  {cn}: {data['count']} paths (רקע)")
        else:
            total = data.get('total_length_pts', 0)
            print(f"  {cn}: {data['count']} paths, אורך כולל {total:.0f} pts")

    print(f"\n--- סמלים ---")
    for cn, data in result['symbols'].items():
        print(f"  {cn}: {data['small_filled_paths']} paths קטנים => {data['clusters']} אשכולות")

    print(f"\n--- OCR ---")
    for region, data in result['ocr_regions'].items():
        lines = data['text'].split('\n')
        non_empty = [l for l in lines if l.strip()]
        print(f"  {region}: {data['char_count']} תווים, {len(non_empty)} שורות")
        # מדגם 3 שורות
        for line in non_empty[:3]:
            print(f"    > {line[:80]}")

    print(f"{'='*60}")


# === ריצה ראשית ===
if __name__ == '__main__':
    # ברירת מחדל: E01 בת ים
    base = r'C:\Users\LENOVO\Desktop\cluade\contractor-demo\training-data\bat-yam-school'

    # מוצא את תיקיית החשמל
    e01_path = None
    for d in os.listdir(base):
        full = os.path.join(base, d)
        if os.path.isdir(full) and d != 'extracted':
            try:
                files = os.listdir(full)
            except:
                continue
            if any('E-kfir-E-01' in f for f in files):
                e01_path = os.path.join(full, 'E-kfir-E-01.pdf')
                break

    if not e01_path:
        print("שגיאה: לא מצאתי את E01!")
        sys.exit(1)

    # אפשר גם לקבל נתיב מ-command line
    if len(sys.argv) > 1:
        e01_path = sys.argv[1]

    output_dir = os.path.join(base, 'extracted')

    print(f"מחלץ: {e01_path}")
    result = extract_plan(e01_path, output_dir=output_dir)
    print_summary(result)
