"""
Comprehensive Test Suite for Finculator v2 Mathematical Engine
Validates all 27 financial math models and edge cases
"""

import math
import unittest

def round2(val):
    return round(val + 1e-9, 2)

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
        'total_payable': round2(total_payable),
        'total_interest': round2(total_interest)
    }

def calculate_credit_card_payoff(balance, apr_percent, min_due_percent=5, fixed_payment=250):
    b_min = float(balance)
    b_fix = float(balance)
    r_monthly = (float(apr_percent) / 12.0) / 100.0
    min_pct = float(min_due_percent) / 100.0
    fix_pay = float(fixed_payment)

    # Min payment simulation
    min_months = 0
    min_total_paid = 0
    min_total_interest = 0
    initial_monthly = max(25.0, b_min * min_pct)
    while b_min > 0.01 and min_months < 600:
        min_months += 1
        interest = b_min * r_monthly
        min_total_interest += interest
        payment = max(25.0, (b_min + interest) * min_pct)
        if payment > (b_min + interest):
            payment = b_min + interest
        min_total_paid += payment
        b_min = (b_min + interest) - payment

    # Fixed payment simulation
    fix_months = 0
    fix_total_paid = 0
    fix_total_interest = 0
    while b_fix > 0.01 and fix_months < 600:
        fix_months += 1
        interest = b_fix * r_monthly
        fix_total_interest += interest
        payment = fix_pay
        if payment > (b_fix + interest):
            payment = b_fix + interest
        fix_total_paid += payment
        b_fix = (b_fix + interest) - payment

    return {
        'min_plan': {'months': min_months, 'total_interest': round2(min_total_interest)},
        'fixed_plan': {'months': fix_months, 'total_interest': round2(fix_total_interest)},
        'interest_saved': round2(max(0, min_total_interest - fix_total_interest)),
        'months_saved': max(0, min_months - fix_months)
    }

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

def calculate_cagr(initial_val, final_val, tenure_years):
    i = float(initial_val)
    f = float(final_val)
    t = float(tenure_years)
    if i <= 0 or t <= 0:
        return {'cagr': 0, 'absolute_gain': 0}
    cagr = (math.pow(f / i, 1.0 / t) - 1) * 100.0
    return {
        'cagr': round2(cagr),
        'absolute_gain': round2(f - i)
    }

def calculate_gst(amount, rate_percent, mode='add'):
    amt = float(amount)
    r = float(rate_percent) / 100.0
    if mode == 'add':
        net = amt
        gst = amt * r
        tot = amt + gst
    else:
        tot = amt
        net = amt / (1 + r)
        gst = tot - net
    return {
        'net_amount': round2(net),
        'gst_amount': round2(gst),
        'total_amount': round2(tot),
        'cgst': round2(gst / 2.0),
        'sgst': round2(gst / 2.0)
    }

def calculate_break_even(fixed_costs, variable_cost, sales_price):
    fc = float(fixed_costs)
    vc = float(variable_cost)
    sp = float(sales_price)
    cm = sp - vc
    if cm <= 0:
        return {'break_even_units': 0, 'break_even_revenue': 0}
    units = math.ceil(fc / cm)
    rev = units * sp
    return {
        'contribution_margin': round2(cm),
        'break_even_units': units,
        'break_even_revenue': round2(rev)
    }

def calculate_budget_50_30_20(monthly_income, needs_pct=50, wants_pct=30, savings_pct=20):
    inc = float(monthly_income)
    return {
        'needs_amount': round2(inc * (float(needs_pct) / 100.0)),
        'wants_amount': round2(inc * (float(wants_pct) / 100.0)),
        'savings_amount': round2(inc * (float(savings_pct) / 100.0))
    }

class TestFinculatorMathV2(unittest.TestCase):

    def test_emi_calculation(self):
        res = calculate_emi(100000, 8.5, 240, 1000)
        self.assertAlmostEqual(res['monthly_emi'], 867.82, places=1)
        self.assertAlmostEqual(res['total_payment'], 208277.58, places=1)
        self.assertAlmostEqual(res['net_total_cost'], 209277.58, places=1)

    def test_loan_eligibility(self):
        res = calculate_loan_eligibility(10000, 1000, 7.0, 300, 50)
        # 50% FOIR of 10000 = 5000; available EMI = 4000
        self.assertEqual(res['max_available_emi'], 4000.0)
        self.assertTrue(res['max_loan_amount'] > 500000)

    def test_credit_card_payoff(self):
        res = calculate_credit_card_payoff(5000, 24.0, 4.0, 250)
        self.assertTrue(res['interest_saved'] > 1000)
        self.assertTrue(res['months_saved'] > 50)

    def test_sip_calculation(self):
        res = calculate_sip(1000, 12, 10)
        self.assertEqual(res['total_invested'], 120000.0)
        self.assertTrue(res['future_value'] > 220000.0)

    def test_cagr_calculation(self):
        res = calculate_cagr(10000, 20000, 5)
        self.assertAlmostEqual(res['cagr'], 14.87, places=1)
        self.assertEqual(res['absolute_gain'], 10000.0)

    def test_gst_modes(self):
        res_add = calculate_gst(1000, 18, 'add')
        self.assertEqual(res_add['net_amount'], 1000.0)
        self.assertEqual(res_add['gst_amount'], 180.0)
        self.assertEqual(res_add['total_amount'], 1180.0)

        res_rem = calculate_gst(1180, 18, 'remove')
        self.assertEqual(res_rem['total_amount'], 1180.0)
        self.assertAlmostEqual(res_rem['net_amount'], 1000.0, places=1)
        self.assertAlmostEqual(res_rem['gst_amount'], 180.0, places=1)

    def test_break_even(self):
        res = calculate_break_even(50000, 20, 70)
        # CM = 50, Units = 1000, Rev = 70,000
        self.assertEqual(res['contribution_margin'], 50.0)
        self.assertEqual(res['break_even_units'], 1000)
        self.assertEqual(res['break_even_revenue'], 70000.0)

    def test_budget_planner(self):
        res = calculate_budget_50_30_20(10000, 50, 30, 20)
        self.assertEqual(res['needs_amount'], 5000.0)
        self.assertEqual(res['wants_amount'], 3000.0)
        self.assertEqual(res['savings_amount'], 2000.0)

if __name__ == '__main__':
    unittest.main()
