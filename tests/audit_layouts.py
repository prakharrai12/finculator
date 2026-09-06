import subprocess
import os
import shutil
import tempfile
import urllib.request

def run_audit():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(chrome_path):
        # Check alternate Chrome paths
        local_app = os.environ.get('LOCALAPPDATA', '')
        alt_path = os.path.join(local_app, r'Google\Chrome\Application\chrome.exe')
        if os.path.exists(alt_path):
            chrome_path = alt_path

    temp_dir = tempfile.mkdtemp()
    launcher_path = 'audit_launcher.html'

    # The 13 actual primary calculator and platform views in Finculator
    routes = [
        'emi', 'prepayment', 'comparator', 'eligibility',
        'credit-card', 'savings-compound', 'invest-sip', 'tax-income',
        'inflation', 'fire', 'net-worth', 'buy-vs-rent', 'budget'
    ]

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

    results = {}
    try:
        with open(launcher_path, 'w', encoding='utf-8') as f:
            f.write(audit_page)

        print("--- Auditing all 13 Finculator Calculator views ---")

        # First verify server availability
        try:
            req = urllib.request.Request('http://localhost:3000/index.html', headers={'User-Agent': 'Audit/1.0'})
            with urllib.request.urlopen(req, timeout=3) as resp:
                print(f"[SERVER OK] http://localhost:3000 responded with HTTP {resp.status}")
        except Exception as e:
            print(f"[SERVER WARN] Could not reach http://localhost:3000: {e}")

        if not os.path.exists(chrome_path):
            print(f"[AUDIT INFO] Chrome binary not found at {chrome_path}. Visual layout check skipped.")
            return results

        for r in routes:
            out_img = os.path.join(temp_dir, f"{r}.png")
            cmd = [
                chrome_path,
                '--headless=new',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                f'--user-data-dir={temp_dir}',
                '--window-size=1440,900',
                f'--screenshot={out_img}',
                f'http://localhost:3000/index.html#/{r}'
            ]
            try:
                subprocess.run(cmd, capture_output=True, timeout=12)
                size = os.path.getsize(out_img) if os.path.exists(out_img) else 0
                results[r] = {'size': size, 'exists': os.path.exists(out_img)}
                status = 'PASS' if size > 15000 else 'WARN'
                print(f"[{status}] Route #/{r:<18} rendered ({size:>6} bytes)")
            except subprocess.TimeoutExpired:
                print(f"[TIMEOUT] Route #/{r:<18} screenshot timed out")
                results[r] = {'size': 0, 'exists': False}
            except Exception as ex:
                print(f"[ERROR]   Route #/{r:<18} error: {ex}")
                results[r] = {'size': 0, 'exists': False}

    finally:
        if os.path.exists(launcher_path):
            try:
                os.remove(launcher_path)
            except Exception:
                pass
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

    return results

if __name__ == '__main__':
    run_audit()
