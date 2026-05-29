from fastapi import FastAPI, UploadFile, File
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import shutil
import os

app = FastAPI()

model = load_model("vegetable_model.h5")

class_names = [
    "carrot",
    "tomato",
    "potato",
    "onion"
]  # kendi class isimlerini yaz

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = image.load_img(temp_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)
    predicted_index = np.argmax(prediction)
    confidence = float(np.max(prediction))

    os.remove(temp_path)

    return {
        "class": class_names[predicted_index],
        "confidence": confidence
    }