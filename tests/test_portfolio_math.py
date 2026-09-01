import unittest

class TestPortfolioMath(unittest.TestCase):
    def setUp(self):
        self.sample_state = {
            'assets': {
                'cashChecking': 150000,
                'savingsAccounts': 350000,
                'moneyMarket': 100000,
                'fixedDeposits': 600000,
                'recurringDeposits': 200000,
                'stocksEquities': 1800000,
                'mutualFundsETFs': 2400000,
                'bondsFixedIncome': 500000,
                'retirementAccounts': 1200000,
                'primaryResidence': 8500000,
                'investmentProperties': 0,
                'vehicles': 800000,
                'valuablesArtJewelry': 500000,
                'businessEquity': 0,
                'lifeInsuranceCashValue': 250000,
                'receivables': 100000
            },
            'liabilities': {
                'creditCards': 45000,
                'mortgagePrimary': 4800000,
                'mortgageInvestment': 0,
                'autoLoans': 320000,
                'studentLoans': 0,
                'personalLoans': 0,
                'linesOfCredit': 0,
                'unpaidTaxes': 0,
                'otherDebts': 0
            },
            'income': {
                'primarySalary': 200000,
                'secondarySalary': 0,
                'businessIncome': 0,
                'rentalIncome': 0,
                'dividendsInterest': 15000,
                'otherIncome': 0
            },
            'expenses': {
                'fixedLiving': 75000,
                'variableDiscretionary': 35000,
                'debtPayments': 45000
            },
            'holdings': [
                {'name': 'Nifty 50', 'qty': 100, 'buyPrice': 150, 'currentPrice': 200},
                {'name': 'HDFC Bank', 'qty': 50, 'buyPrice': 1400, 'currentPrice': 1600}
            ]
        }

    def test_net_worth_calculation(self):
        assets = self.sample_state['assets']
        liab = self.sample_state['liabilities']
        
        liquid = assets['cashChecking'] + assets['savingsAccounts'] + assets['moneyMarket']
        fixed_dep = assets['fixedDeposits'] + assets['recurringDeposits']
        investments = assets['stocksEquities'] + assets['mutualFundsETFs'] + assets['bondsFixedIncome']
        retirement = assets['retirementAccounts']
        re = assets['primaryResidence'] + assets['investmentProperties']
        veh = assets['vehicles']
        val = assets['valuablesArtJewelry']
        other = assets['businessEquity'] + assets['lifeInsuranceCashValue'] + assets['receivables']
        
        total_assets = liquid + fixed_dep + investments + retirement + re + veh + val + other
        self.assertEqual(total_assets, 17450000)

        total_liab = sum(liab.values())
        self.assertEqual(total_liab, 5165000)

        net_worth = total_assets - total_liab
        self.assertEqual(net_worth, 12285000)

    def test_cash_flow_ratios(self):
        inc = self.sample_state['income']
        exp = self.sample_state['expenses']
        
        total_inc = sum(inc.values())
        total_exp = sum(exp.values())
        
        self.assertEqual(total_inc, 215000)
        self.assertEqual(total_exp, 155000)
        
        surplus = total_inc - total_exp
        self.assertEqual(surplus, 60000)
        
        savings_rate = (surplus / total_inc) * 100
        self.assertAlmostEqual(savings_rate, 27.90697, places=2)

    def test_holdings_gain_loss(self):
        holdings = self.sample_state['holdings']
        # H1: 100 * 150 = 15000 cost, 100 * 200 = 20000 val -> +5000 (33.33%)
        # H2: 50 * 1400 = 70000 cost, 50 * 1600 = 80000 val -> +10000 (14.29%)
        total_cost = (100 * 150) + (50 * 1400)
        total_val = (100 * 200) + (50 * 1600)
        gain = total_val - total_cost
        
        self.assertEqual(total_cost, 85000)
        self.assertEqual(total_val, 100000)
        self.assertEqual(gain, 15000)

    def test_blank_state_handling(self):
        blank_state = {
            'assets': {},
            'liabilities': {},
            'income': {},
            'expenses': {},
            'holdings': []
        }
        total_assets = sum(blank_state['assets'].values())
        total_liab = sum(blank_state['liabilities'].values())
        net_worth = total_assets - total_liab
        self.assertEqual(total_assets, 0)
        self.assertEqual(total_liab, 0)
        self.assertEqual(net_worth, 0)

if __name__ == '__main__':
    unittest.main()
