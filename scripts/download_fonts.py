import os
import re
import urllib.request

FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fonts')
CSS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'css')
FONTS_CSS_PATH = os.path.join(CSS_DIR, 'fonts.css')

os.makedirs(FONTS_DIR, exist_ok=True)

# Google fonts URL requesting latin subset
URL = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap&subset=latin"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

req = urllib.request.Request(URL, headers=headers)
with urllib.request.urlopen(req) as resp:
    css_content = resp.read().decode('utf-8')

# Find all font-face blocks
# Example block:
# /* latin */
# @font-face {
#   font-family: 'Inter';
#   font-style: normal;
#   font-weight: 400;
#   font-display: swap;
#   src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2) format('woff2');
#   unicode-range: U+0000-00FF, ...;
# }

blocks = re.findall(r'(/\*\s*([^*]+?)\s*\*/\s*@font-face\s*\{[^}]+\})', css_content, re.DOTALL)

# Keep only latin blocks to keep bundle ultra-lean (< 150KB total)
local_css_blocks = []
count = 0

for full_block, subset in blocks:
    if 'latin' not in subset.lower():
        continue
    
    # Extract url
    url_match = re.search(r'url\((https://[^)]+\.woff2)\)', full_block)
    if not url_match:
        continue
    
    remote_url = url_match.group(1)
    
    # Extract family and weight
    family_match = re.search(r"font-family:\s*['\"]([^'\"]+)['\"]", full_block)
    weight_match = re.search(r"font-weight:\s*([^;]+);", full_block)
    style_match = re.search(r"font-style:\s*([^;]+);", full_block)
    
    family = family_match.group(1).replace(' ', '-').lower() if family_match else 'font'
    weight = weight_match.group(1).strip() if weight_match else '400'
    style = style_match.group(1).strip() if style_match else 'normal'
    
    filename = f"{family}-{style}-{weight}-latin.woff2".replace('..', '-')
    dest_path = os.path.join(FONTS_DIR, filename)
    
    # Download file if not exists
    if not os.path.exists(dest_path):
        print(f"Downloading {filename} from {remote_url}...")
        font_req = urllib.request.Request(remote_url, headers=headers)
        with urllib.request.urlopen(font_req) as font_resp:
            with open(dest_path, 'wb') as f:
                f.write(font_resp.read())
    
    # Replace url in block
    local_block = full_block.replace(remote_url, f"../fonts/{filename}")
    local_css_blocks.append(local_block)
    count += 1

with open(FONTS_CSS_PATH, 'w', encoding='utf-8') as f:
    f.write("/* Finculator Self-Hosted Modern WOFF2 Fonts with Zero Third-Party Latency */\n\n")
    f.write("\n\n".join(local_css_blocks))
    f.write("\n")

print(f"[OK] Downloaded and configured {count} self-hosted WOFF2 fonts in {FONTS_CSS_PATH}")
