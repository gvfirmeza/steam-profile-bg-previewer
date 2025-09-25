from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time
import re
import sys

# === CONFIG ===
# Se usar Chrome portátil, coloque o caminho do chrome.exe aqui.
CHROME_BINARY = r"D:\DEV\chrome-win64\chrome.exe"

URL = "https://store.steampowered.com/points/shop/c/backgrounds/cluster/3"
SAIDA_JSON = "steam_backgrounds.json"

# === SETUP DO DRIVER ===
def make_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    if CHROME_BINARY:
        options.binary_location = CHROME_BINARY  # caminho do chrome.exe (navegador)

    # Selenium Manager resolve o chromedriver automaticamente
    return webdriver.Chrome(options=options)

# === SCROLL INFINITO CONTROLADO ===
def scroll_to_bottom(driver, pause_time=2.0, max_scrolls=40, min_delta=50):
    last_height = driver.execute_script("return document.body.scrollHeight")
    for i in range(max_scrolls):
        print(f"Scroll {i + 1}/{max_scrolls}")
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause_time)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if abs(new_height - last_height) < min_delta:
            print("Nada novo foi carregado; parando o scroll.")
            break
        last_height = new_height

# === EXTRAÇÃO DE IMAGENS (somente profilebackground) ===
def coletar_imagens_profilebackground(driver):
    # Aguarda carregar alguma imagem
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "img"))
        )
    except Exception:
        print("⚠️ Não encontrei imagens iniciais na página.", file=sys.stderr)

    scroll_to_bottom(driver)

    # Pega imagens cujo src OU data-src contenha 'profilebackground'
    elementos = driver.find_elements(
        By.CSS_SELECTOR,
        'img[src*="profilebackground"], img[data-src*="profilebackground"]'
    )

    urls = []
    for img in elementos:
        src = img.get_attribute("src") or img.get_attribute("data-src")
        if not src:
            continue
        # mantém apenas as que realmente contêm 'profilebackground'
        if "profilebackground" not in src:
            continue
        # remove querystring (?size=..., etc.)
        cleaned = re.sub(r"\?.*$", "", src)
        urls.append(cleaned)

    # remove duplicatas preservando ordem
    seen = set()
    deduped = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            deduped.append(u)
    return deduped

# === MAIN ===
def main():
    driver = make_driver()
    try:
        driver.get(URL)
        urls = coletar_imagens_profilebackground(driver)

        with open(SAIDA_JSON, "w", encoding="utf-8") as f:
            json.dump(urls, f, indent=4, ensure_ascii=False)

        print(f"✅ {len(urls)} imagens (profilebackground) salvas em {SAIDA_JSON}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
