import tensorflow as tf
import numpy as np
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

img_path = "kabak.png"

model = tf.keras.models.load_model("vegetable_model.keras", compile=False)

with open("labels.txt", "r", encoding="utf-8") as f:
    class_names = [line.strip() for line in f.readlines()]

img = Image.open(img_path).convert("RGB")
img = img.resize((224, 224))

img_array = np.array(img, dtype=np.float32)
img_array = np.expand_dims(img_array, axis=0)

# MobileNetV2 preprocess
img_array = preprocess_input(img_array)

predictions = model.predict(img_array)
predicted_index = np.argmax(predictions[0])
confidence = predictions[0][predicted_index]

print("Tahmin:", class_names[predicted_index])
print("Güven:", float(confidence))