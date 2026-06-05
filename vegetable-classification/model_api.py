from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import numpy as np
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model("merged_model.keras", compile=False)

with open("labels.txt", "r", encoding="utf-8") as f:
    class_names = [line.strip() for line in f if line.strip()]


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img = img.resize((224, 224))

    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    prediction = model.predict(img_array, verbose=0)
    predicted_index = int(np.argmax(prediction[0]))
    confidence = float(prediction[0][predicted_index])

    return {
        "class": class_names[predicted_index],
        "confidence": confidence
    }


@app.get("/classes")
def get_classes():
    return {"classes": class_names, "count": len(class_names)}
