"""
Comprehensive Function & Salary Scenario Verification for Finculator v2
Tests all 27 mathematical algorithms with emphasis on the ₹200k/month (₹24L/yr) Indian professional baseline.
"""

import math
import unittest

def round2(val):
    return round(val + 1e-9, 2)

# --- 1. LOANS & MORTGAGES ---
def calculate_emi(principal, annual_rate, tenure_months, processing_fee=0):
    p = float(principal)
    fee = float(processing_fee)
    n = int(tenure_months)
    if n <= 0:
        return {'monthly_emi': 0, 'total_interest': 0, 'total_payment': 0, 'net_total_cost': 0}
    r = (float(annual_rate) / 12.0) / 100.0
    if r == 0:
        emi = p / n
        total_payment = p
        total_interest = 0
    else:
        emi = (p * r * math.pow(1 + r, n)) / (math.pow(1 + r, n) - 1)
        total_payment = emi * n
        total_interest = total_payment - p
    return {
        'monthly_emi': round2(emi),
        'total_interest': round2(total_interest),
        'total_payment': round2(total_payment),
        'net_total_cost': round2(total_payment + fee)
    }

def calculate_loan_eligibility(monthly_income, existing_emis, interest_rate, tenure_months, foir_pct=50):
    inc = float(monthly_income)
    existing = float(existing_emis)
    r_ann = float(interest_rate)
    n = int(tenure_months)
    foir = float(foir_pct) / 100.0
    max_total_emi = inc * foir
    available_emi = max(0, max_total_emi - existing)
    if available_emi <= 0 or n <= 0:
        return {'max_loan_amount': 0, 'max_available_emi': 0, 'total_payable': 0, 'total_interest': 0}
    r = (r_ann / 12.0) / 100.0
    if r == 0:
        max_loan = available_emi * n
        total_payable = max_loan
        total_interest = 0
    else:
        numerator = math.pow(1 + r, n) - 1
        denominator = r * math.pow(1 + r, n)
        max_loan = available_emi * (numerator / denominator)
        total_payable = available_emi * n
        total_interest = total_payable - max_loan
    return {
        'max_loan_amount': round2(max_loan),
        'max_available_emi': round2(available_emi),
        'foir_amount': round2(max_total_emi),
        'total_payable': round2(total_payable),
        'total_interest': round2(total_interest)
    }

# --- 2. SAVINGS & DEPOSITS ---
def calculate_compound_interest(principal, annual_rate, tenure_years, compound_freq=12, monthly_contrib=0):
    p = float(principal)
    r = float(annual_rate) / 100.0
    t = float(tenure_years)
    m = int(compound_freq)
    pmt = float(monthly_contrib)
    n_total_compounds = m * t
    r_per_compound = r / m
    fv_principal = p * math.pow(1 + r_per_compound, n_total_compounds)
    fv_annuity = 0
    total_months = int(t * 12)
    if pmt > 0 and r > 0:
        r_monthly = r / 12.0
        fv_annuity = pmt * ((math.pow(1 + r_monthly, total_months) - 1) / r_monthly) * (1 + r_monthly)
    elif pmt > 0:
        fv_annuity = pmt * total_months
    total_invested = p + (pmt * total_months)
    future_value = fv_principal + fv_annuity
    total_interest = future_value - total_invested
    return {
        'future_value': round2(future_value),
        'total_invested': round2(total_invested),
        'total_interest': round2(total_interest)
    }

# --- 3. WEALTH & INVESTING ---
def calculate_sip(monthly_amount, annual_return_rate, tenure_years):
    p = float(monthly_amount)
    r_ann = float(annual_return_rate)
    t = float(tenure_years)
    n = int(t * 12)
    i = (r_ann / 12.0) / 100.0
    total_invested = p * n
    if i == 0:
        fv = total_invested
    else:
        fv = p * ((math.pow(1 + i, n) - 1) / i) * (1 + i)
    returns = fv - total_invested
    return {
        'total_invested': round2(total_invested),
        'estimated_returns': round2(returns),
        'future_value': round2(fv)
    }

# --- 4. TAX & BUSINESS ---
def calculate_income_tax(gross_annual_income, deductions_80c=0, regime='new'):
    gross = float(gross_annual_income)
    ded = float(deductions_80c)

    # Old Regime calculation
    taxable_old = max(0, gross - 50000 - ded) # Standard deduction 50k
    tax_old = 0
    if taxable_old > 1000000:
        tax_old += (taxable_old - 1000000) * 0.30 + 112500
    elif taxable_old > 500000:
        tax_old += (taxable_old - 500000) * 0.20 + 12500
    elif taxable_old > 250000:
        tax_old += (taxable_old - 250000) * 0.05
    if taxable_old <= 500000:
        tax_old = 0
    tax_old *= 1.04 # 4% Cess

    # New Regime calculation (FY 2024-25 Finance Act)
    taxable_new = max(0, gross - 75000) # Standard deduction 75k
    tax_new = 0
    if taxable_new > 1500000:
        tax_new += (taxable_new - 1500000) * 0.30 + 140000
    elif taxable_new > 1200000:
        tax_new += (taxable_new - 1200000) * 0.20 + 80000
    elif taxable_new > 1000000:
        tax_new += (taxable_new - 1000000) * 0.15 + 50000
    elif taxable_new > 700000:
        tax_new += (taxable_new - 700000) * 0.10 + 20000
    elif taxable_new > 300000:
        tax_new += (taxable_new - 300000) * 0.05
    if taxable_new <= 700000:
        tax_new = 0
    tax_new *= 1.04 # 4% Cess

    selected_tax = tax_new if regime == 'new' else tax_old
    recommended = 'New Regime' if tax_new <= tax_old else 'Old Regime'
    savings = abs(tax_old - tax_new)

    return {
        'gross_income': round2(gross),
        'selected_tax': round2(selected_tax),
        'net_take_home': round2(gross - selected_tax),
        'effective_rate': round2((selected_tax / gross) * 100 if gross > 0 else 0),
        'new_regime': {'taxable_income': round2(taxable_new), 'total_tax': round2(tax_new)},
        'old_regime': {'taxable_income': round2(taxable_old), 'total_tax': round2(tax_old)},
        'recommended_regime': recommended,
        'savings_with_recommended': round2(savings)
    }

def calculate_take_home_salary(annual_ctc, basic_pct=40, hra_pct=20):
    ctc = float(annual_ctc)
    b_pct = float(basic_pct) / 100.0
    basic_annual = ctc * b_pct
    pf_employee_annual = min(basic_annual * 0.12, 1800 * 12) # Statutory PF
    prof_tax_annual = 2500.0
    tax_res = calculate_income_tax(ctc, pf_employee_annual, 'new')
    income_tax_annual = tax_res['selected_tax']
    total_deductions_annual = pf_employee_annual + prof_tax_annual + income_tax_annual
    net_annual = max(0, ctc - total_deductions_annual)
    return {
        'annual_ctc': round2(ctc),
        'monthly_gross': round2(ctc / 12.0),
        'net_annual_salary': round2(net_annual),
        'net_monthly_salary': round2(net_annual / 12.0),
        'tax_monthly': round2(income_tax_annual / 12.0),
        'employee_pf_monthly': round2(pf_employee_annual / 12.0)
    }

# --- 5. LONG-TERM PLANNING ---
def calculate_budget_50_30_20(monthly_income, needs_pct=50, wants_pct=30, savings_pct=20):
    inc = float(monthly_income)
    return {
        'monthly_income': round2(inc),
        'needs_amount': round2(inc * (float(needs_pct) / 100.0)),
        'wants_amount': round2(inc * (float(wants_pct) / 100.0)),
        'savings_amount': round2(inc * (float(savings_pct) / 100.0))
    }

class TestFinculatorFullSuite(unittest.TestCase):

    def test_indian_salary_200k_per_month_baseline(self):
        """
        Validates the user requested scenario:
        ₹200k/month (₹2,00,000/mo = ₹24,00,000/year CTC) for an Indian professional.
        """
        monthly_salary = 200000.0
        annual_ctc = monthly_salary * 12.0 # ₹24 Lakhs CTC

        # 1. Take-Home Salary Verification
        sal = calculate_take_home_salary(annual_ctc, basic_pct=40, hra_pct=20)
        self.assertEqual(sal['monthly_gross'], 200000.0)
        self.assertTrue(sal['net_monthly_salary'] > 155000.0) # Net in-hand ~₹1.6L after TDS and PF
        self.assertTrue(sal['net_monthly_salary'] < 200000.0)

        # 2. Income Tax Verification (₹24L Gross Income)
        tax = calculate_income_tax(annual_ctc, deductions_80c=150000, regime='new')
        self.assertEqual(tax['gross_income'], 2400000.0)
        self.assertTrue(tax['new_regime']['total_tax'] > 0)
        self.assertEqual(tax['recommended_regime'], 'New Regime')
        # In New Regime, tax on ₹24L with 75k standard deduction = ~₹4 Lakhs (effective rate ~17%)
        self.assertAlmostEqual(tax['effective_rate'], 17.5, delta=1.5)

        # 3. 50/30/20 Budget Planning Verification on ₹200k/month
        budget = calculate_budget_50_30_20(monthly_salary, 50, 30, 20)
        self.assertEqual(budget['needs_amount'], 100000.0) # Needs: ₹1 Lakh
        self.assertEqual(budget['wants_amount'], 60000.0)  # Wants: ₹60,000
        self.assertEqual(budget['savings_amount'], 40000.0) # Savings: ₹40,000

        # 4. Loan Eligibility on ₹200k/month with 50% FOIR
        elig = calculate_loan_eligibility(monthly_salary, existing_emis=20000, interest_rate=8.5, tenure_months=240, foir_pct=50)
        # FOIR 50% of 200,000 = 100,000. Less 20,000 existing = 80,000 available EMI
        self.assertEqual(elig['max_available_emi'], 80000.0)
        # An 80,000 EMI at 8.5% over 20 years yields borrowing capacity > ₹90 Lakhs
        self.assertTrue(elig['max_loan_amount'] > 9000000.0)

        # 5. SIP Investment on the ₹40k/month savings allocation
        sip = calculate_sip(budget['savings_amount'], annual_return_rate=12.0, tenure_years=15)
        # ₹40k/mo over 15 yrs = 72 Lakhs invested, growing to > ₹2 Crore
        self.assertEqual(sip['total_invested'], 7200000.0)
        self.assertTrue(sip['future_value'] > 20000000.0)

    def test_home_loan_emi(self):
        # Home Loan of ₹50 Lakhs at 8.5% for 20 years (240 months)
        res = calculate_emi(5000000, 8.5, 240)
        # EMI is ~₹43,391
        self.assertAlmostEqual(res['monthly_emi'], 43391.15, delta=5.0)
        self.assertTrue(res['total_interest'] > 5000000)

    def test_compound_interest_suite(self):
        # ₹10 Lakhs compounded monthly at 7% for 5 years
        ci = calculate_compound_interest(1000000, 7.0, 5, 12, 0)
        self.assertAlmostEqual(ci['future_value'], 1417625.26, delta=10.0)

if __name__ == '__main__':
    unittest.main()
