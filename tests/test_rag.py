import unittest
import json
import re

# Load financial knowledge base data structure
with open('js/components/financialRAG.js', 'r', encoding='utf-8') as f:
    rag_content = f.read()

class TestFinancialRAG(unittest.TestCase):
    def test_knowledge_base_completeness(self):
        """Verify all core financial domains exist in RAG corpus"""
        expected_domains = [
            'tax_old_vs_new',
            'take_home_salary',
            'loan_prepayment',
            'loan_eligibility_foir',
            'emi_loan_repayment',
            'loan_comparator',
            'credit_card_trap',
            'sip_systematic_plan',
            'step_up_sip',
            'lump_sum_compound',
            'ppf_provident_fund',
            'fire_retirement_corpus',
            'budget_50_30_20',
            'inflation_purchasing_power',
            'buy_vs_rent',
            'gst_and_business'
        ]
        for domain in expected_domains:
            self.assertIn(domain, rag_content, f"Missing financial domain: {domain}")

    def test_routes_validity(self):
        """Verify that all calculator routes referenced in RAG are valid site routes"""
        valid_routes = [
            'emi', 'prepayment', 'comparator', 'eligibility', 'credit-card',
            'savings-compound', 'savings-ppf',
            'invest-sip', 'invest-stepup',
            'tax-income', 'tax-salary', 'tax-gst',
            'fire', 'inflation', 'budget', 'buy-vs-rent'
        ]
        for route in valid_routes:
            self.assertIn(f"route: '{route}'", rag_content, f"Route {route} not properly bound in RAG")

    def test_dynamic_math_evaluator_present(self):
        """Verify dynamic math evaluation for EMI, SIP, and Budget requests"""
        self.assertIn('evaluateDynamicMathQuery', rag_content)
        self.assertIn('calculateEMI', rag_content)
        self.assertIn('calculateSIP', rag_content)
        self.assertIn('type: \'emi_calc\'', rag_content)
        self.assertIn('type: \'sip_calc\'', rag_content)
        self.assertIn('type: \'budget_calc\'', rag_content)

if __name__ == '__main__':
    unittest.main()
