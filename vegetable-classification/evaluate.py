import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from collections import defaultdict

model = tf.keras.models.load_model("merged_model.keras", compile=False)

with open("labels.txt", "r", encoding="utf-8") as f:
    class_names = [l.strip() for l in f if l.strip()]

test_dataset = tf.keras.utils.image_dataset_from_directory(
    "dataset/merged_dataset/test",
    image_size=(224, 224),
    batch_size=64,
    shuffle=False
)

test_class_names = test_dataset.class_names

AUTOTUNE = tf.data.AUTOTUNE
test_dataset = test_dataset.map(
    lambda x, y: (preprocess_input(x), y)
).prefetch(AUTOTUNE)

correct = defaultdict(int)
total   = defaultdict(int)
overall_correct = 0
overall_total   = 0

for images, labels in test_dataset:
    preds = model.predict(images, verbose=0)
    pred_indices = tf.argmax(preds, axis=1).numpy()
    for pred, true in zip(pred_indices, labels.numpy()):
        cls = test_class_names[true]
        total[cls] += 1
        overall_total += 1
        if pred == true:
            correct[cls] += 1
            overall_correct += 1

print(f"\nGenel doğruluk: {overall_correct}/{overall_total} = {overall_correct/overall_total*100:.2f}%\n")

# En düşük performanslı 10 sınıf
worst = sorted(total.keys(), key=lambda c: correct[c]/total[c])[:10]
print("En düşük performanslı 10 sınıf:")
for cls in worst:
    acc = correct[cls] / total[cls] * 100
    print(f"  {cls:<30} {correct[cls]:>4}/{total[cls]:<4} = {acc:.1f}%")

# En yüksek performanslı 10 sınıf
best = sorted(total.keys(), key=lambda c: correct[c]/total[c], reverse=True)[:10]
print("\nEn yüksek performanslı 10 sınıf:")
for cls in best:
    acc = correct[cls] / total[cls] * 100
    print(f"  {cls:<30} {correct[cls]:>4}/{total[cls]:<4} = {acc:.1f}%")
