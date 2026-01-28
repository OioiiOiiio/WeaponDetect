import io
import base64
from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image as PILImage
from ultralytics import YOLO
import json
from datetime import datetime
from pathlib import Path
from typing import List
from fpdf import FPDF

HISTORY_FILE = Path("history.json")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Загружаем модель.
model = YOLO('yolo26m_2h.pt')

def save_history(entry: dict):
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history: List[dict] = json.load(f)
    else:
        history = []

    history.insert(0, entry)

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


@app.post("/detect")
async def detect_endpoint(file: UploadFile = File(...)):
    # Чтение файла
    image_data = await file.read()
    image = PILImage.open(io.BytesIO(image_data)).convert("RGB")

    # conf=0.2 -> Мин степень уверенности
    results = model.predict(image, conf=0.2)

    result = results[0]

    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]
        confidence = float(box.conf[0])

        detections.append({
            "class": class_name,
            "confidence": round(confidence, 2)
        })

    # Рисуем результат
    im_array = result.plot()
    im_pil = PILImage.fromarray(im_array[..., ::-1])
    buffered = io.BytesIO()
    im_pil.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

    history_entry = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "detections": detections,
        "total": len(detections),
        "image": f"data:image/jpeg;base64,{img_str}",
    }

    save_history(history_entry)

    return {
        "image": f"data:image/jpeg;base64,{img_str}",
        "detections": detections
    }

@app.get("/history")
def get_history():
    if not HISTORY_FILE.exists():
        return []

    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/history/report/pdf")
def export_history_pdf():
    if not HISTORY_FILE.exists():
        raise HTTPException(status_code=404, detail="История пуста")

    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)

    pdf = FPDF()
    pdf.add_page()

    # Подключаем шрифт
    pdf.add_font('DejaVu', '', 'DejaVuSans.ttf')

    # Заголовок отчета
    pdf.set_font('DejaVu', size=18)
    pdf.cell(0, 15, txt="Журнал детекций объектов", ln=True, align='C')
    pdf.ln(5)

    for entry in history:
        if pdf.get_y() > 230:
            pdf.add_page()

        start_y = pdf.get_y()

        # Левая колонка с фото
        img_b64 = entry.get("image", "").split(",")[-1]
        img_height = 45
        img_width= 60
        if img_b64:
            try:
                img_bytes = base64.b64decode(img_b64)
                img_io = io.BytesIO(img_bytes)
                pdf.image(img_io, x=10, y=start_y, h=img_height, w=img_width)
            except Exception:
                pdf.set_xy(10, start_y)
                pdf.cell(60, img_height, txt="[Ошибка фото]", border=1)

        # Правая колонка
        pdf.set_xy(75, start_y)

        # Время
        pdf.set_font('DejaVu', size=11)
        timestamp = entry.get("timestamp", "N/A").replace("T", " ")
        pdf.cell(0, 8, txt=f"Дата: {timestamp}", ln=True)

        # Объекты
        pdf.set_x(75)
        total = entry.get("total", 0)
        pdf.set_font('DejaVu', size=10)

        detections_text = f"Распознано всего объектов: {total}\n"
        for d in entry.get("detections", []):
            detections_text += f"• {d['class']} — {int(d['confidence'] * 100)}%\n"

        pdf.multi_cell(0, 6, txt=detections_text)

        current_y = pdf.get_y()
        bottom_of_entry = max(current_y, start_y + img_height) + 5

        pdf.set_y(bottom_of_entry)
        pdf.line(10, bottom_of_entry, 200, bottom_of_entry)  # Разделительная черта
        pdf.ln(5)

    # Генерация байтов
    pdf_bytes = bytes(pdf.output())
    filename = f"report_{datetime.now().strftime('%d_%m_%Y')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)