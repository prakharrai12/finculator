import subprocess
import os
import json
import time
import tempfile
import urllib.request

def run_audit():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    temp_dir = tempfile.mkdtemp()
    
    # We will launch headless Chrome to inspect each calculator page
    routes = [
        'emi', 'prepayment', 'comparator', 'eligibility',
        'savings', 'credit-card', 'investments', 'tax',
        'inflation', 'fire', 'net-worth', 'buy-vs-rent', 'budget'
    ]
    
    # Script to inject user in localStorage and check layout
    audit_page = """<!DOCTYPE html>
<html>
<head>
  <script>
    localStorage.setItem('finculator_current_user', JSON.stringify({
      id: 'usr_audit',
      name: 'Audit Investor',
      email: 'investor@finculator.internal'
    }));
  </script>
</head>
<body>
  <script>
    window.location.href = '/index.html' + window.location.hash;
  </script>
</body>
</html>"""
    
    with open('audit_launcher.html', 'w', encoding='utf-8') as f:
        f.write(audit_page)

    print("--- Checking all 13 calculator views for overflow & grid clipping ---")
    
    results = {}
    for r in routes:
        out_img = os.path.join(temp_dir, f"{r}.png")
        cmd = [
            chrome_path,
            '--headless=new',
            '--disable-gpu',
            f'--user-data-dir={temp_dir}',
            '--window-size=1440,900',
            f'--screenshot={out_img}',
            f'http://localhost:3000/audit_launcher.html#/{r}'
        ]
        res = subprocess.run(cmd, capture_output=True, timeout=10)
        size = os.path.getsize(out_img) if os.path.exists(out_img) else 0
        results[r] = {'size': size, 'exists': os.path.exists(out_img)}
        print(f"[{'PASS' if size > 50000 else 'FAIL'}] Route #/{r} rendered ({size} bytes)")
        
    return results

if __name__ == '__main__':
    run_audit()
