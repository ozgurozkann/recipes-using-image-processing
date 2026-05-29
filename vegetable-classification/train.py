import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import matplotlib.pyplot as plt

# Veri yolları
train_dir = "dataset/Vegetable Images/train"
val_dir = "dataset/Vegetable Images/validation"
test_dir = "dataset/Vegetable Images/test"

# Parametreler
img_size = (224, 224)
batch_size = 32

# Veri setlerini yükle
train_dataset = tf.keras.utils.image_dataset_from_directory(
    train_dir,
    image_size=img_size,
    batch_size=batch_size
)

val_dataset = tf.keras.utils.image_dataset_from_directory(
    val_dir,
    image_size=img_size,
    batch_size=batch_size
)

test_dataset = tf.keras.utils.image_dataset_from_directory(
    test_dir,
    image_size=img_size,
    batch_size=batch_size,
    shuffle=False
)

class_names = train_dataset.class_names
print("Sınıflar:", class_names)

# Performans için optimize
AUTOTUNE = tf.data.AUTOTUNE

# Preprocessing fonksiyonu
def prepare_dataset(images, labels):
    images = preprocess_input(images)
    return images, labels

train_dataset = train_dataset.map(prepare_dataset).prefetch(buffer_size=AUTOTUNE)
val_dataset = val_dataset.map(prepare_dataset).prefetch(buffer_size=AUTOTUNE)
test_dataset = test_dataset.map(prepare_dataset).prefetch(buffer_size=AUTOTUNE)

# Data augmentation
data_augmentation = models.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
])

# Base model
base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet"
)
base_model.trainable = False

# Model
inputs = tf.keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(len(class_names), activation="softmax")(x)

model = tf.keras.Model(inputs, outputs)

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

# Eğit
history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=10
)

# Test
test_loss, test_acc = model.evaluate(test_dataset)
print(f"Test accuracy: {test_acc:.4f}")

# Model kaydet
model.save("vegetable_model.keras")
print("Model kaydedildi: vegetable_model.keras")

# Sınıf isimlerini kaydet
with open("labels.txt", "w", encoding="utf-8") as f:
    for name in class_names:
        f.write(name + "\n")

print("Etiketler kaydedildi: labels.txt")

# Grafik
plt.plot(history.history["accuracy"], label="train accuracy")
plt.plot(history.history["val_accuracy"], label="val accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.title("Training History")
plt.show()