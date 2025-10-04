from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time
import re
import sys

CHROME_BINARY = r"D:\DEV\chrome-win64\chrome.exe"
URL = "https://store.steampowered.com/points/shop/c/backgrounds/cluster/3"
OUTPUT_JSON = "../steam_backgrounds.json"  # Output to root instead of public

def make_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    if CHROME_BINARY:
        options.binary_location = CHROME_BINARY
    return webdriver.Chrome(options=options)

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

def coletar_imagens_profilebackground(driver):
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "img"))
        )
    except Exception:
        print("⚠️ Não encontrei imagens iniciais na página.", file=sys.stderr)
    
    scroll_to_bottom(driver)
    
    paineis = driver.find_elements(
        By.CSS_SELECTOR,
        'div._2EUBPpuLIR8PTTb_d40Gv9.CcuoOiSs23_Y___I-1Myh._3xgzPpOhEZZ4X79DUyurfa.Panel.Focusable'
    )
    
    total_paineis = len(paineis)
    print(f"Total de painéis encontrados: {total_paineis}")
    
    resultados = []
    idx = 0
    
    while idx < total_paineis:
        print(f"\n--- Processando {idx + 1}/{total_paineis} ---")
        try:
            paineis = driver.find_elements(
                By.CSS_SELECTOR,
                'div._2EUBPpuLIR8PTTb_d40Gv9.CcuoOiSs23_Y___I-1Myh._3xgzPpOhEZZ4X79DUyurfa.Panel.Focusable'
            )
            
            if idx >= len(paineis):
                print(f"❌ Índice {idx} fora do alcance. Parando.")
                break
                
            painel = paineis[idx]
            
            img_profile = painel.find_element(By.CSS_SELECTOR, 'img[src*="profilebackground"]')
            src = img_profile.get_attribute("src")
            
            if not src or "size=" not in src:
                print(f"⚠️ Pulando: sem 'size='")
                idx += 1
                continue
            
            cleaned_img = re.sub(r"\?.*$", "", src)
            
            img_game = painel.find_element(By.CSS_SELECTOR, 'img._3RN5Yt4DuIZQ7nREAU7pp3')
            game = img_game.get_attribute("title") or "Sem título"
            print(f"Jogo: {game}")
            
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", painel)
            time.sleep(0.5)
            driver.execute_script("arguments[0].click();", painel)
            time.sleep(2.5)
            
            try:
                all_modal_divs = driver.find_elements(By.CSS_SELECTOR, 'div._1btwTfkSqO_Fh0RwwUFkTI.Panel.Focusable')
                modal_title_div = all_modal_divs[-1]
                
                title = driver.execute_script("""
                    var elem = arguments[0];
                    for (var j = 0; j < elem.childNodes.length; j++) {
                        if (elem.childNodes[j].nodeType === Node.TEXT_NODE) {
                            var text = elem.childNodes[j].textContent.trim();
                            if (text.length > 0) {
                                return text;
                            }
                        }
                    }
                    return '';
                """, modal_title_div)
                
                print(f"Title: '{title}'")
                
                # Try multiple approaches to find the store link
                store_url = None
                
                # Approach 1: Look for the link in the visible modal area
                try:
                    modal_links = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/points/shop/app/"]')
                    # Get the last/most recent link (should be from the currently open modal)
                    if modal_links:
                        store_url = modal_links[-1].get_attribute("href")
                        print(f"Found store URL (approach 1): {store_url}")
                except Exception as e1:
                    print(f"Approach 1 failed: {e1}")
                
                # Approach 2: Search within the modal parent
                if not store_url:
                    try:
                        # Find parent modal container
                        modal_parent = modal_title_div.find_element(By.XPATH, './../..')
                        modal_link = modal_parent.find_element(By.CSS_SELECTOR, 'a[href*="/points/shop/app/"]')
                        store_url = modal_link.get_attribute("href")
                        print(f"Found store URL (approach 2): {store_url}")
                    except Exception as e2:
                        print(f"Approach 2 failed: {e2}")
                
                # Approach 3: Search in any visible modal area
                if not store_url:
                    try:
                        # Look for modal containers with different class patterns
                        modal_containers = driver.find_elements(By.CSS_SELECTOR, 'div[class*="Modal"], div[class*="modal"]')
                        for container in modal_containers:
                            try:
                                modal_link = container.find_element(By.CSS_SELECTOR, 'a[href*="/points/shop/app/"]')
                                store_url = modal_link.get_attribute("href")
                                print(f"Found store URL (approach 3): {store_url}")
                                break
                            except:
                                continue
                    except Exception as e3:
                        print(f"Approach 3 failed: {e3}")
                
                if not store_url:
                    print("⚠️ Não conseguiu encontrar store_url, usando placeholder")
                    store_url = f"https://store.steampowered.com/points/shop/app/placeholder_{idx}"
                
                resultados.append({
                    "title": title,
                    "game": game,
                    "url": store_url,
                    "img": cleaned_img
                })
                
                print(f"✓ Salvo! Total: {len(resultados)}")
                
                driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                time.sleep(0.8)
                
            except Exception as e:
                print(f"⚠️ Erro no modal: {e}")
                try:
                    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                    time.sleep(0.8)
                except:
                    pass
                
            idx += 1
                
        except Exception as e:
            print(f"⚠️ Erro ao processar: {e}")
            idx += 1
            continue
    
    print(f"\n=== Total coletado: {len(resultados)} ===")
    
    seen = set()
    deduped = []
    for item in resultados:
        img_url = item["img"]
        if img_url not in seen:
            seen.add(img_url)
            deduped.append(item)
    
    return deduped

def main():
    driver = make_driver()
    try:
        driver.get(URL)
        resultados = coletar_imagens_profilebackground(driver)
        
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(resultados, f, indent=4, ensure_ascii=False)
        
        print(f"✅ {len(resultados)} imagens salvas em {OUTPUT_JSON}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
