import os
import json
import time

try:
    from deep_translator import MyMemoryTranslator
except ImportError:
    print("Ошибка: библиотека deep-translator не установлена.")
    exit(1)

new_items = [
    {"alt": "Yuna in the kitchen reaching for a jar on the top shelf", "caption": "Late-night snack run. The 'mid or feed' shirt makes a statement even at 3 AM — and yes, the heart-print underwear is a thing now."},
    {"alt": "Yuna leaning on the kitchen counter, looking sleepy", "caption": "Waiting for the coffee to kick in. A classic post-marathon 'low HP' state."},
    {"alt": "Yuna reaching up to a kitchen cabinet, black t-shirt lifting", "caption": "The secret to her high rating (and late-night energy) is stored way up high."},
    {"alt": "Yuna in a beige mid or feed t-shirt holding a mug", "caption": "A different shirt, same energy. Holding a warm mug and contemplating whether to queue for one more game."},
    {"alt": "Yuna sitting on her bed, looking tired", "caption": "Sitting on the bed, half-asleep and barely awake. The post-game adrenaline has completely worn off."},
    {"alt": "Yuna lying on the bed next to a glowing monitor", "caption": "Curled up next to the monitor. She claims she's just 'resting her eyes', but the PC is still on."},
    {"alt": "Yuna sitting in bed with a laptop", "caption": "Laptop open, but her attention is elsewhere. Maybe it's time to close the game for the night... or not."}
]

# Исправленные коды для MyMemory
lang_map = {
    "cs": "cs-CZ", "da": "da-DK", "de": "de-DE", "en": "en-GB", "es": "es-ES", "es-es": "es-ES", 
    "fi": "fi-FI", "fil": "fil-PH", "fr": "fr-FR", "hu": "hu-HU", "id": "id-ID", "it": "it-IT", 
    "ja": "ja-JP", "ko": "ko-KR", "ms": "ms-MY", "nb": "nb-NO", "nl": "nl-NL", "pl": "pl-PL", 
    "pt-br": "pt-BR", "pt": "pt-PT", "ro": "ro-RO", "ru": "ru-RU", "sv": "sv-SE", "th": "th-TH", 
    "tr": "tr-TR", "vi": "vi-VN", "zh-Hant": "zh-TW"
}

locales_dir = os.path.join("data", "locales")
print("Начинаю ИСПРАВЛЕНИЕ (через MyMemory)...")

for filename in os.listdir(locales_dir):
    if not filename.endswith(".json"):
        continue
        
    lang_code = filename.replace(".json", "")
    if lang_code not in lang_map:
        continue
        
    filepath = os.path.join(locales_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            continue

    try:
        yuna_gallery = data["content"]["characters"]["yuna"]["gallery"]
    except KeyError:
        continue

    # Откатываем английский текст, который вставился из-за прошлых ошибок
    if len(yuna_gallery) > 7:
        del yuna_gallery[7:]
    
    if lang_code == "en":
        yuna_gallery.extend(new_items)
        print(f"[en] Успешно добавлено")
    else:
        try:
            # Указываем en-GB вместо en
            translator = MyMemoryTranslator(source='en-GB', target=lang_map[lang_code])
            
            for item in new_items:
                try:
                    alt_text = translator.translate(item["alt"])
                    time.sleep(1.5) # Пауза для MyMemory
                    cap_text = translator.translate(item["caption"])
                    time.sleep(1.5)
                    
                    yuna_gallery.append({"alt": alt_text, "caption": cap_text})
                except Exception as e:
                    yuna_gallery.append(item) # Если ошибка - оставляем английский
            
            print(f"[{lang_code}] Успешно переведено")
        except Exception as e:
            print(f"[{lang_code}] Критическая ошибка: {e}")
            yuna_gallery.extend(new_items)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    time.sleep(2)

print("Готово! Все локали исправлены.")