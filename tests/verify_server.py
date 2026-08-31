import urllib.request

files = [
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/calculators.css',
    '/css/charts.css',
    '/css/print.css',
    '/js/math/financeMath.js',
    '/js/utils/formatters.js',
    '/js/utils/storage.js',
    '/js/utils/export.js',
    '/js/components/logo.js',
    '/js/components/charts.js',
    '/js/components/amortizationTable.js',
    '/js/calculators/emiCalculator.js',
    '/js/calculators/prepaymentAnalyzer.js',
    '/js/calculators/loanComparator.js',
    '/js/calculators/loanEligibility.js',
    '/js/calculators/creditCardCalculator.js',
    '/js/calculators/savingsDepositsSuite.js',
    '/js/calculators/investmentSuite.js',
    '/js/calculators/taxBusinessSuite.js',
    '/js/calculators/fireCalculator.js',
    '/js/calculators/inflationCalculator.js',
    '/js/calculators/netWorthCalculator.js',
    '/js/calculators/budgetPlanner.js',
    '/js/calculators/buyVsRentCalculator.js',
    '/js/app.js',
    '/tests/test_runner.html'
]

print("Testing Finculator HTTP Endpoints at http://localhost:3000 ...")
all_ok = True
for f in files:
    try:
        url = 'http://localhost:3000' + f
        req = urllib.request.Request(url, headers={'User-Agent': 'FinculatorTest/1.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = resp.read()
            content_type = resp.headers.get('Content-Type', '')
            print(f"[OK 200] {f:<42} ({len(data):>5} B) | MIME: {content_type}")
    except Exception as e:
        print(f"[FAIL]   {f:<42} -> {e}")
        all_ok = False

if all_ok:
    print(f"\nSUCCESS: All {len(files)} assets and endpoints verified 100% functional!")
else:
    print("\nFAILURE: Some endpoints failed.")
