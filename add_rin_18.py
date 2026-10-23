import json
import glob
import os

def add_18_plus_tag():
    # Ищем все JSON файлы в папке локализации
    locale_files = glob.glob("data/locales/*.json")
    
    if not locale_files:
        print("Ошибка: Не найдены файлы локализации в папке data/locales/")
        print("Убедитесь, что скрипт запускается из корневой папки сайта.")
        return

    modified_count = 0

    for path in locale_files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Проверяем, есть ли структура content -> characters -> rin -> tags
            if "content" in data and "characters" in data["content"] and "rin" in data["content"]["characters"]:
                rin_data = data["content"]["characters"]["rin"]
                
                if "tags" not in rin_data:
                    rin_data["tags"] = []
                
                # Если тега 18+ еще нет, добавляем его в начало
                if "18+" not in rin_data["tags"]:
                    rin_data["tags"].insert(0, "18+")
                    
                    with open(path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    
                    print(f"[ОК] Тег 18+ добавлен для Рин в: {os.path.basename(path)}")
                    modified_count += 1
                else:
                    print(f"[ПРОПУЩЕНО] У Рин уже есть 18+ в: {os.path.basename(path)}")
            else:
                print(f"[ПРОПУЩЕНО] Блок Рин не найден в: {os.path.basename(path)}")

        except Exception as e:
            print(f"[ОШИБКА] Не удалось обработать {os.path.basename(path)}: {e}")

    print(f"\n=== ГОТОВО! Изменено файлов: {modified_count} ===")

if __name__ == "__main__":
    add_18_plus_tag()
    input("\nНажмите Enter, чтобы закрыть это окно...")