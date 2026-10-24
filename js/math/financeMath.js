/**
 * Finculator Core Financial Math Engine (v2)
 * Comprehensive, pure, standalone financial calculation algorithms
 */

/**
 * Standard rounding to 2 decimal places with precision protection
 * @param {number} num 
 * @returns {number}
 */
export function round2(num) {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * 1. EMI / Loan Repayment Calculation
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(principal, annualRate, tenureMonths, processingFeePct = 0) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.round(Number(tenureMonths) || 1));
  const rAnnual = Math.max(0, Number(annualRate) || 0);
  const feePct = Math.max(0, Number(processingFeePct) || 0);

  if (P === 0) {
    return {
      monthlyEMI: 0,
      totalInterest: 0,
      totalPayment: 0,
      processingFee: 0,
      netTotalCost: 0,
      principalPercent: 100,
      interestPercent: 0
    };
  }

  let monthlyEMI = 0;
  if (rAnnual === 0) {
    monthlyEMI = round2(P / n);
  } else {
    const r = (rAnnual / 100) / 12;
    const factor = Math.pow(1 + r, n);
    monthlyEMI = round2(P * r * (factor / (factor - 1)));
  }

  const totalPayment = round2(monthlyEMI * n);
  const totalInterest = round2(Math.max(0, totalPayment - P));
  const processingFee = round2(P * (feePct / 100));
  const netTotalCost = round2(totalPayment + processingFee);

  const total = totalPayment || 1;
  const principalPercent = round2((P / total) * 100);
  const interestPercent = round2(100 - principalPercent);

  return {
    monthlyEMI,
    totalInterest,
    totalPayment,
    processingFee,
    netTotalCost,
    principalPercent,
    interestPercent
  };
}

/**
 * 2. Loan Amortization Schedule Generator (with Prepayments)
 */
export function generateAmortizationSchedule(
  principal,
  annualRate,
  tenureMonths,
  extraMonthlyPayment = 0,
  annualLumpSum = 0
) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.round(Number(tenureMonths) || 1));
  const rAnnual = Math.max(0, Number(annualRate) || 0);
  const extraMonthly = Math.max(0, Number(extraMonthlyPayment) || 0);
  const extraAnnual = Math.max(0, Number(annualLumpSum) || 0);

  if (P === 0) {
    return {
      monthlySchedule: [],
      yearlySchedule: [],
      actualMonths: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      totalExtraPaid: 0,
      totalCost: 0
    };
  }

  const r = (rAnnual / 100) / 12;
  let scheduledEMI = 0;
  if (rAnnual === 0) {
    scheduledEMI = P / n;
  } else {
    const factor = Math.pow(1 + r, n);
    scheduledEMI = P * r * (factor / (factor - 1));
  }

  let balance = P;
  const monthlySchedule = [];
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalExtra = 0;

  let month = 1;
  const maxMonths = n * 2;

  while (balance > 0.005 && month <= maxMonths) {
    const openingBalance = balance;
    const interestForMonth = rAnnual === 0 ? 0 : balance * r;
    let scheduledPrincipal = scheduledEMI - interestForMonth;

    if (scheduledPrincipal > balance || (month === n && extraMonthly === 0 && extraAnnual === 0)) {
      scheduledPrincipal = balance;
    }

    let extraForThisMonth = extraMonthly;
    if (month % 12 === 0) {
      extraForThisMonth += extraAnnual;
    }

    const remainingAfterScheduled = Math.max(0, balance - scheduledPrincipal);
    if (extraForThisMonth > remainingAfterScheduled) {
      extraForThisMonth = remainingAfterScheduled;
    }

    const totalPrincipalThisMonth = scheduledPrincipal + extraForThisMonth;
    const actualEMI = scheduledPrincipal + interestForMonth;
    const totalPaidThisMonth = actualEMI + extraForThisMonth;
    let closingBalance = Math.max(0, openingBalance - totalPrincipalThisMonth);
    if (closingBalance < 0.01) {
      closingBalance = 0;
    }

    monthlySchedule.push({
      month,
      year: Math.ceil(month / 12),
      openingBalance: round2(openingBalance),
      emi: round2(actualEMI),
      principalPaid: round2(scheduledPrincipal),
      interestPaid: round2(interestForMonth),
      extraPayment: round2(extraForThisMonth),
      totalPaid: round2(totalPaidThisMonth),
      closingBalance: round2(closingBalance)
    });

    totalInterest += interestForMonth;
    totalPrincipal += scheduledPrincipal;
    totalExtra += extraForThisMonth;
    balance = closingBalance;
    month++;
  }

  const yearlySchedule = [];
  const totalYears = Math.ceil(monthlySchedule.length / 12);

  for (let y = 1; y <= totalYears; y++) {
    const yearMonths = monthlySchedule.filter((m) => m.year === y);
    if (yearMonths.length === 0) continue;

    const opening = yearMonths[0].openingBalance;
    const closing = yearMonths[yearMonths.length - 1].closingBalance;
    const princSum = yearMonths.reduce((acc, m) => acc + m.principalPaid, 0);
    const intSum = yearMonths.reduce((acc, m) => acc + m.interestPaid, 0);
    const extraSum = yearMonths.reduce((acc, m) => acc + m.extraPayment, 0);
    const totalSum = yearMonths.reduce((acc, m) => acc + m.totalPaid, 0);

    yearlySchedule.push({
      year: y,
      openingBalance: round2(opening),
      principalPaid: round2(princSum),
      interestPaid: round2(intSum),
      extraPaid: round2(extraSum),
      totalPaid: round2(totalSum),
      closingBalance: round2(closing)
    });
  }

  return {
    monthlySchedule,
    yearlySchedule,
    actualMonths: monthlySchedule.length,
    totalInterestPaid: round2(totalInterest),
    totalPrincipalPaid: round2(totalPrincipal),
    totalExtraPaid: round2(totalExtra),
    totalCost: round2(totalPrincipal + totalInterest + totalExtra)
  };
}

/**
 * 3. Prepayment & Mortgage Payoff Comparison
 */
export function calculateMortgagePayoffComparison(
  principal,
  annualRate,
  tenureMonths,
  extraMonthlyPayment,
  annualLumpSum = 0
) {
  const original = generateAmortizationSchedule(principal, annualRate, tenureMonths, 0, 0);
  const revised = generateAmortizationSchedule(
    principal,
    annualRate,
    tenureMonths,
    extraMonthlyPayment,
    annualLumpSum
  );

  const emiData = calculateEMI(principal, annualRate, tenureMonths);

  const interestSaved = round2(Math.max(0, original.totalInterestPaid - revised.totalInterestPaid));
  const monthsSaved = Math.max(0, original.actualMonths - revised.actualMonths);
  const yearsSaved = round2(monthsSaved / 12);
  const totalCostReduction = round2(Math.max(0, original.totalCost - revised.totalCost));

  return {
    original: {
      months: original.actualMonths,
      monthlyEMI: emiData.monthlyEMI,
      totalInterest: original.totalInterestPaid,
      totalCost: original.totalCost
    },
    revised: {
      months: revised.actualMonths,
      monthlyEMI: round2(emiData.monthlyEMI + (Number(extraMonthlyPayment) || 0)),
      totalInterest: revised.totalInterestPaid,
      totalCost: revised.totalCost,
      extraPaid: revised.totalExtraPaid
    },
    savings: {
      interestSaved,
      monthsSaved,
      yearsSaved,
      totalCostReduction
    },
    originalSchedule: original.yearlySchedule,
    revisedSchedule: revised.yearlySchedule
  };
}

/**
 * 4. Loan Eligibility Calculator (Reverse-solve borrowing power)
 * FOIR = Fixed Obligation to Income Ratio (e.g. 50%)
 */
export function calculateLoanEligibility(monthlyIncome, existingEMIs, annualRate, tenureMonths, foirPct = 50) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const existing = Math.max(0, Number(existingEMIs) || 0);
  const rAnnual = Math.max(0.1, Number(annualRate) || 7.5);
  const n = Math.max(1, Number(tenureMonths) || 240);
  const foir = Math.max(10, Math.min(100, Number(foirPct) || 50)) / 100;

  const maxTotalEMI = income * foir;
  const maxAvailableEMI = Math.max(0, maxTotalEMI - existing);

  if (maxAvailableEMI <= 0) {
    return {
      maxLoanAmount: 0,
      maxAvailableEMI: 0,
      foirAmount: round2(maxTotalEMI),
      totalPayable: 0,
      totalInterest: 0
    };
  }

  const r = (rAnnual / 100) / 12;
  const factor = Math.pow(1 + r, n);
  // P = E * (factor - 1) / (r * factor)
  const maxLoan = maxAvailableEMI * (factor - 1) / (r * factor);
  const maxLoanAmount = round2(maxLoan);
  const totalPayable = round2(maxAvailableEMI * n);
  const totalInterest = round2(Math.max(0, totalPayable - maxLoanAmount));

  return {
    maxLoanAmount,
    maxAvailableEMI: round2(maxAvailableEMI),
    foirAmount: round2(maxTotalEMI),
    totalPayable,
    totalInterest
  };
}

/**
 * 5. Credit Card Minimum-Due Payoff Trap Calculator
 */
export function calculateCreditCardPayoff(balance, aprPercent, minDuePercent = 5, fixedMonthlyPayment = 0) {
  const P = Math.max(0, Number(balance) || 0);
  const apr = Math.max(0, Number(aprPercent) || 0);
  const minPct = Math.max(1, Number(minDuePercent) || 5) / 100;
  const fixedPay = Math.max(0, Number(fixedMonthlyPayment) || 0);

  if (P === 0) {
    return {
      minPlan: { months: 0, totalPaid: 0, totalInterest: 0, initialMonthly: 0, isPayoffPossible: true, schedule: [] },
      fixedPlan: { months: 0, totalPaid: 0, totalInterest: 0, monthlyPayment: 0, isPayoffPossible: true, schedule: [] },
      savings: { interestSaved: 0, monthsSaved: 0, yearsSaved: 0 }
    };
  }

  const r = (apr / 100) / 12;
  const initialMonthlyInterest = P * r;

  // Plan A: Minimum payment (e.g. 5% or $25 minimum)
  let balMin = P;
  let monthsMin = 0;
  let intMin = 0;
  let paidMin = 0;
  const schedMin = [];
  let isMinPossible = true;

  const initialMinDue = Math.max(25, P * minPct);
  if (apr > 0 && initialMinDue <= initialMonthlyInterest) {
    isMinPossible = false;
  }

  if (isMinPossible) {
    while (balMin > 1 && monthsMin < 600) {
      monthsMin++;
      const intForMonth = balMin * r;
      let pmt = Math.max(25, balMin * minPct);
      if (pmt <= intForMonth && balMin > 1) {
        isMinPossible = false;
        break;
      }
      if (pmt > balMin + intForMonth) {
        pmt = balMin + intForMonth;
      }
      const princPaid = pmt - intForMonth;
      balMin = Math.max(0, balMin - princPaid);
      intMin += intForMonth;
      paidMin += pmt;

      if (monthsMin % 12 === 0 || balMin <= 1) {
        schedMin.push({
          year: Math.ceil(monthsMin / 12),
          month: monthsMin,
          balance: round2(balMin),
          totalPaid: round2(paidMin),
          totalInterest: round2(intMin)
        });
      }
    }
    if (balMin > 1) {
      isMinPossible = false;
    }
  }

  // Plan B: Fixed monthly payment (e.g. user specified or 2x initial min due)
  const targetFixed = fixedPay > 0 ? fixedPay : round2(Math.max(P * minPct * 2, initialMonthlyInterest * 1.5, 50));
  let balFix = P;
  let monthsFix = 0;
  let intFix = 0;
  let paidFix = 0;
  const schedFix = [];
  let isFixPossible = targetFixed > initialMonthlyInterest;

  if (isFixPossible) {
    while (balFix > 1 && monthsFix < 600) {
      monthsFix++;
      const intForMonth = balFix * r;
      let pmt = targetFixed;
      if (pmt > balFix + intForMonth) {
        pmt = balFix + intForMonth;
      }
      const princPaid = pmt - intForMonth;
      balFix = Math.max(0, balFix - princPaid);
      intFix += intForMonth;
      paidFix += pmt;

      if (monthsFix % 12 === 0 || balFix <= 1) {
        schedFix.push({
          year: Math.ceil(monthsFix / 12),
          month: monthsFix,
          balance: round2(balFix),
          totalPaid: round2(paidFix),
          totalInterest: round2(intFix)
        });
      }
    }
    if (balFix > 1) {
      isFixPossible = false;
    }
  }

  const interestSaved = (isMinPossible && isFixPossible) ? round2(Math.max(0, intMin - intFix)) : 0;
  const monthsSaved = (isMinPossible && isFixPossible) ? Math.max(0, monthsMin - monthsFix) : 0;

  return {
    minPlan: {
      months: isMinPossible ? monthsMin : Infinity,
      totalPaid: isMinPossible ? round2(paidMin) : Infinity,
      totalInterest: isMinPossible ? round2(intMin) : Infinity,
      initialMonthly: round2(initialMinDue),
      isPayoffPossible: isMinPossible,
      schedule: schedMin
    },
    fixedPlan: {
      months: isFixPossible ? monthsFix : Infinity,
      totalPaid: isFixPossible ? round2(paidFix) : Infinity,
      totalInterest: isFixPossible ? round2(intFix) : Infinity,
      monthlyPayment: targetFixed,
      isPayoffPossible: isFixPossible,
      schedule: schedFix
    },
    savings: {
      interestSaved,
      monthsSaved,
      yearsSaved: round2(monthsSaved / 12)
    }
  };
}

/**
 * 6. Compound Interest
 */
export function calculateCompoundInterest(
  principal,
  annualRate,
  years,
  frequency = 'annually',
  regularContribution = 0,
  contributionFrequency = 'monthly'
) {
  const P = Math.max(0, Number(principal) || 0);
  const rAnnual = Math.max(0, Number(annualRate) || 0) / 100;
  const t = Math.max(0.1, Number(years) || 1);
  const PMT = Math.max(0, Number(regularContribution) || 0);

  const freqMap = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    semiannually: 2,
    annually: 1
  };
  const n = freqMap[frequency.toLowerCase()] || 1;
  const pmtFreq = contributionFrequency.toLowerCase() === 'annually' ? 1 : 12;

  const totalYears = Math.ceil(t);
  const yearlyBreakdown = [];
  let currentBalance = P;
  let accumulatedDeposits = P;
  let accumulatedInterest = 0;

  for (let year = 1; year <= totalYears; year++) {
    const yearFrac = year <= Math.floor(t) ? 1 : (t - Math.floor(t));
    if (yearFrac <= 0) break;

    const startBalance = currentBalance;
    const yearDeposits = PMT * pmtFreq * yearFrac;

    const subPeriods = Math.max(1, Math.round(n * yearFrac));
    const ratePerSubPeriod = rAnnual / n;
    const pmtPerSubPeriod = (PMT * pmtFreq) / n;

    let subBalance = startBalance;
    for (let s = 0; s < subPeriods; s++) {
      const interestStep = subBalance * ratePerSubPeriod;
      subBalance = subBalance + interestStep + pmtPerSubPeriod;
    }

    const yearInterest = subBalance - startBalance - yearDeposits;
    accumulatedDeposits += yearDeposits;
    accumulatedInterest += yearInterest;
    currentBalance = subBalance;

    yearlyBreakdown.push({
      year,
      deposits: round2(yearDeposits),
      totalDeposits: round2(accumulatedDeposits),
      interestEarned: round2(yearInterest),
      totalInterest: round2(accumulatedInterest),
      balance: round2(currentBalance)
    });
  }

  const effectiveRate = round2((Math.pow(1 + rAnnual / n, n) - 1) * 100);

  return {
    futureValue: round2(currentBalance),
    totalDeposits: round2(accumulatedDeposits),
    totalInterest: round2(accumulatedInterest),
    effectiveRate,
    yearlyBreakdown
  };
}

/**
 * 7. Simple Interest
 */
export function calculateSimpleInterest(principal, annualRate, years) {
  const P = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(annualRate) || 0) / 100;
  const t = Math.max(0.1, Number(years) || 1);

  const totalInterest = round2(P * r * t);
  const totalAmount = round2(P + totalInterest);

  const totalYears = Math.ceil(t);
  const yearlyBreakdown = [];
  const annualInterest = P * r;

  for (let y = 1; y <= totalYears; y++) {
    const yrFraction = y <= Math.floor(t) ? 1 : (t - Math.floor(t));
    const intForYear = annualInterest * yrFraction;
    const totInt = annualInterest * (y <= Math.floor(t) ? y : t);

    yearlyBreakdown.push({
      year: y,
      interestEarned: round2(intForYear),
      totalInterest: round2(totInt),
      balance: round2(P + totInt)
    });
  }

  return {
    principal: round2(P),
    totalInterest,
    totalAmount,
    yearlyBreakdown
  };
}

/**
 * 8. Fixed Deposit (FD) Calculator
 */
export function calculateFixedDeposit(principal, annualRate, tenureMonths, compoundingFrequency = 'quarterly') {
  const P = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(annualRate) || 0) / 100;
  const months = Math.max(1, Number(tenureMonths) || 12);
  const t = months / 12;

  const freqMap = { monthly: 12, quarterly: 4, semiannually: 2, annually: 1 };
  let n = 4;
  if (typeof compoundingFrequency === 'number' && compoundingFrequency > 0) {
    n = Math.min(365, Math.max(1, Math.round(compoundingFrequency)));
  } else if (typeof compoundingFrequency === 'string') {
    n = freqMap[compoundingFrequency.toLowerCase()] || 4;
  }

  const maturityAmount = round2(P * Math.pow(1 + r / n, n * t));
  const totalInterest = round2(Math.max(0, maturityAmount - P));

  return {
    principal: round2(P),
    maturityAmount,
    totalInterest,
    tenureMonths: months,
    interestPercent: round2((totalInterest / maturityAmount) * 100)
  };
}

/**
 * 9. Recurring Deposit (RD) Calculator (Quarterly compounding standard)
 */
export function calculateRecurringDeposit(monthlyDeposit, annualRate, tenureMonths) {
  const P = Math.max(0, Number(monthlyDeposit) || 0);
  const rAnnual = Math.max(0, Number(annualRate) || 0) / 100;
  const n = Math.max(1, Number(tenureMonths) || 12);

  // Standard bank RD quarterly formula: Maturity = P * sum( (1 + r/4)^(4*t_i) )
  let maturityAmount = 0;
  const totalInvested = round2(P * n);

  for (let m = 1; m <= n; m++) {
    const t = (n - m + 1) / 12;
    maturityAmount += P * Math.pow(1 + rAnnual / 4, 4 * t);
  }

  maturityAmount = round2(maturityAmount);
  const totalInterest = round2(Math.max(0, maturityAmount - totalInvested));

  return {
    monthlyDeposit: round2(P),
    totalInvested,
    maturityAmount,
    totalInterest,
    tenureMonths: n
  };
}

/**
 * 10. PPF (Public Provident Fund) / Long-Term Tax-Advantaged Scheme
 * Compounded annually, standard 15-year tenure (extendable in blocks of 5)
 */
export function calculatePPF(annualDeposit, years = 15, annualRate = 7.1) {
  const P = Math.max(0, Number(annualDeposit) || 0);
  const t = Math.max(1, Number(years) || 15);
  const r = Math.max(0, annualRate !== undefined && !isNaN(Number(annualRate)) ? Number(annualRate) : 7.1) / 100;

  let balance = 0;
  let totalInvested = 0;
  const yearlyBreakdown = [];

  for (let y = 1; y <= t; y++) {
    totalInvested += P;
    const interest = (balance + P) * r;
    balance = balance + P + interest;

    yearlyBreakdown.push({
      year: y,
      invested: round2(totalInvested),
      interestEarned: round2(interest),
      totalInterest: round2(balance - totalInvested),
      closingBalance: round2(balance)
    });
  }

  return {
    annualDeposit: round2(P),
    totalInvested: round2(totalInvested),
    totalInterest: round2(balance - totalInvested),
    maturityAmount: round2(balance),
    yearlyBreakdown
  };
}

/**
 * 11. Goal-Based Savings (Reverse Compound Interest)
 * Calculates required monthly/annual savings to reach a target corpus
 */
export function calculateGoalSavings(targetCorpus, years, expectedReturn, initialSavings = 0) {
  const Target = Math.max(0, Number(targetCorpus) || 0);
  const t = Math.max(0.1, Number(years) || 1);
  const rAnnual = Math.max(0, Number(expectedReturn) || 0) / 100;
  const initial = Math.max(0, Number(initialSavings) || 0);

  const initialFutureValue = initial * Math.pow(1 + rAnnual, t);
  const shortfall = Math.max(0, Target - initialFutureValue);

  const nMonths = Math.round(t * 12);
  const rMo = rAnnual / 12;

  let monthlySavings = 0;
  if (shortfall > 0 && nMonths > 0) {
    if (rMo === 0) {
      monthlySavings = shortfall / nMonths;
    } else {
      const factor = Math.pow(1 + rMo, nMonths);
      monthlySavings = (shortfall * rMo) / ((factor - 1) * (1 + rMo));
    }
  }

  const totalDeposits = round2(initial + monthlySavings * nMonths);
  const estimatedReturns = round2(Math.max(0, Target - totalDeposits));

  return {
    targetCorpus: round2(Target),
    monthlySavings: round2(monthlySavings),
    annualSavings: round2(monthlySavings * 12),
    initialSavings: round2(initial),
    initialFutureValue: round2(initialFutureValue),
    shortfall: round2(shortfall),
    totalDeposits,
    estimatedReturns
  };
}

/**
 * 12. SIP (Standard Systematic Investment Plan)
 */
export function calculateSIP(monthlyDeposit, expectedAnnualReturn, years) {
  const P = Math.max(0, Number(monthlyDeposit) || 0);
  const rAnnual = Math.max(0, Number(expectedAnnualReturn) || 0);
  const t = Math.max(0.1, Number(years) || 1);
  const totalMonths = Math.round(t * 12);

  if (P === 0 || totalMonths === 0) {
    return {
      totalInvested: 0,
      estimatedReturns: 0,
      futureValue: 0,
      wealthGainMultiple: 1,
      investedPercent: 100,
      returnsPercent: 0,
      yearlyBreakdown: []
    };
  }

  const i = (rAnnual / 100) / 12;
  const yearlyBreakdown = [];
  let runningBalance = 0;
  let runningInvested = 0;

  for (let m = 1; m <= totalMonths; m++) {
    runningInvested += P;
    if (i === 0) {
      runningBalance += P;
    } else {
      runningBalance = (runningBalance + P) * (1 + i);
    }

    if (m % 12 === 0 || m === totalMonths) {
      const yearNum = Math.ceil(m / 12);
      const estReturns = Math.max(0, runningBalance - runningInvested);
      yearlyBreakdown.push({
        year: yearNum,
        invested: round2(P * (m % 12 === 0 ? 12 : m % 12)),
        totalInvested: round2(runningInvested),
        returns: round2(estReturns),
        futureValue: round2(runningBalance)
      });
    }
  }

  const futureValue = round2(runningBalance);
  const totalInvested = round2(runningInvested);
  const estimatedReturns = round2(Math.max(0, futureValue - totalInvested));
  const wealthGainMultiple = totalInvested > 0 ? round2(futureValue / totalInvested) : 1;
  const investedPercent = futureValue > 0 ? round2((totalInvested / futureValue) * 100) : 100;
  const returnsPercent = round2(100 - investedPercent);

  return {
    totalInvested,
    estimatedReturns,
    futureValue,
    wealthGainMultiple,
    investedPercent,
    returnsPercent,
    yearlyBreakdown
  };
}

/**
 * 13. Step-Up / Top-Up SIP Calculator
 * Monthly investment increases by stepUpPct every 12 months
 */
export function calculateStepUpSIP(initialMonthly, stepUpPct = 10, expectedAnnualReturn = 12, years = 10) {
  const P0 = Math.max(0, Number(initialMonthly) || 0);
  const stepPct = Math.max(0, Number(stepUpPct) || 0) / 100;
  const rAnnual = Math.max(0, Number(expectedAnnualReturn) || 0);
  const t = Math.max(1, Number(years) || 1);
  const totalMonths = Math.round(t * 12);

  const i = (rAnnual / 100) / 12;
  const yearlyBreakdown = [];
  let runningBalance = 0;
  let runningInvested = 0;
  let currentMonthly = P0;

  for (let m = 1; m <= totalMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      currentMonthly = currentMonthly * (1 + stepPct);
    }

    runningInvested += currentMonthly;
    if (i === 0) {
      runningBalance += currentMonthly;
    } else {
      runningBalance = (runningBalance + currentMonthly) * (1 + i);
    }

    if (m % 12 === 0 || m === totalMonths) {
      const yearNum = Math.ceil(m / 12);
      const estReturns = Math.max(0, runningBalance - runningInvested);
      yearlyBreakdown.push({
        year: yearNum,
        monthlyAmount: round2(currentMonthly),
        totalInvested: round2(runningInvested),
        returns: round2(estReturns),
        futureValue: round2(runningBalance)
      });
    }
  }

  const futureValue = round2(runningBalance);
  const totalInvested = round2(runningInvested);
  const estimatedReturns = round2(Math.max(0, futureValue - totalInvested));
  const wealthGainMultiple = totalInvested > 0 ? round2(futureValue / totalInvested) : 1;

  return {
    totalInvested,
    estimatedReturns,
    futureValue,
    wealthGainMultiple,
    finalMonthly: round2(currentMonthly),
    yearlyBreakdown
  };
}

/**
 * 14. Combined SIP + Lump Sum Calculator
 */
export function calculateSIPLumpCombined(initialLump, monthlyDeposit, expectedReturn, years) {
  const lump = Math.max(0, Number(initialLump) || 0);
  const sip = Math.max(0, Number(monthlyDeposit) || 0);
  const rAnnual = Math.max(0, Number(expectedReturn) || 0) / 100;
  const t = Math.max(0.1, Number(years) || 1);
  const totalMonths = Math.round(t * 12);
  const i = rAnnual / 12;

  let balance = lump;
  let invested = lump;
  const yearlyBreakdown = [];

  for (let m = 1; m <= totalMonths; m++) {
    invested += sip;
    balance = (balance + sip) * (1 + i);

    if (m % 12 === 0 || m === totalMonths) {
      const yearNum = Math.ceil(m / 12);
      yearlyBreakdown.push({
        year: yearNum,
        totalInvested: round2(invested),
        returns: round2(Math.max(0, balance - invested)),
        futureValue: round2(balance)
      });
    }
  }

  const futureValue = round2(balance);
  const totalInvested = round2(invested);
  const estimatedReturns = round2(Math.max(0, futureValue - totalInvested));

  return {
    initialLump: round2(lump),
    monthlyDeposit: round2(sip),
    totalInvested,
    estimatedReturns,
    futureValue,
    wealthGainMultiple: totalInvested > 0 ? round2(futureValue / totalInvested) : 1,
    yearlyBreakdown
  };
}

/**
 * 15. Lump Sum Investment
 */
export function calculateLumpSum(principal, annualRate, years) {
  const P = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(annualRate) || 0) / 100;
  const t = Math.max(0.1, Number(years) || 1);

  if (P === 0) {
    return {
      initialInvestment: 0,
      estimatedReturns: 0,
      futureValue: 0,
      wealthGainMultiple: 1,
      investedPercent: 100,
      returnsPercent: 0,
      yearlyBreakdown: []
    };
  }

  const totalYears = Math.ceil(t);
  const yearlyBreakdown = [];

  for (let y = 1; y <= totalYears; y++) {
    const currentY = y <= Math.floor(t) ? y : t;
    const fv = P * Math.pow(1 + r, currentY);
    const returns = fv - P;

    yearlyBreakdown.push({
      year: y,
      invested: round2(P),
      returns: round2(returns),
      futureValue: round2(fv)
    });
  }

  const futureValue = round2(P * Math.pow(1 + r, t));
  const estimatedReturns = round2(futureValue - P);
  const wealthGainMultiple = round2(futureValue / P);
  const investedPercent = round2((P / futureValue) * 100);
  const returnsPercent = round2(100 - investedPercent);

  return {
    initialInvestment: round2(P),
    estimatedReturns,
    futureValue,
    wealthGainMultiple,
    investedPercent,
    returnsPercent,
    yearlyBreakdown
  };
}

/**
 * 16. CAGR (Compound Annual Growth Rate) Calculator
 * Formula: CAGR = (Final Value / Initial Value)^(1 / Years) - 1
 */
export function calculateCAGR(initialValue, finalValue, years) {
  const V0 = Number(initialValue);
  const V1 = Number(finalValue);
  const t = Number(years);

  if (isNaN(V0) || isNaN(V1) || isNaN(t) || V0 <= 0 || V1 < 0 || t <= 0) {
    return {
      initialValue: round2(Math.max(0, V0 || 0)),
      finalValue: round2(Math.max(0, V1 || 0)),
      years: Math.max(0, t || 0),
      cagr: 0,
      totalReturnPercent: 0,
      absoluteGain: 0,
      isValid: false
    };
  }

  const totalReturnPercent = round2(((V1 - V0) / V0) * 100);
  const cagr = round2((Math.pow(V1 / V0, 1 / t) - 1) * 100);
  const absoluteGain = round2(V1 - V0);

  return {
    initialValue: round2(V0),
    finalValue: round2(V1),
    years: round2(t),
    cagr,
    totalReturnPercent,
    absoluteGain,
    isValid: true
  };
}

/**
 * 17. Mutual Fund & Stock Returns Calculator (Absolute vs Annualized)
 */
export function calculateInvestmentReturns(initialValue, finalValue, dividendsReceived = 0, years = 1) {
  const V0 = Math.max(0.01, Number(initialValue) || 1);
  const V1 = Math.max(0, Number(finalValue) || 0);
  const div = Math.max(0, Number(dividendsReceived) || 0);
  const t = Math.max(0.0833, Number(years) || 1);

  const totalWealth = V1 + div;
  const netProfit = round2(totalWealth - V0);
  const absoluteReturn = round2((netProfit / V0) * 100);
  const annualizedReturn = round2((Math.pow(totalWealth / V0, 1 / t) - 1) * 100);

  return {
    initialValue: round2(V0),
    finalValue: round2(V1),
    dividends: round2(div),
    netProfit,
    absoluteReturn,
    annualizedReturn
  };
}

/**
 * 18. Income Tax Configuration & Calculator (Budget 2025 FY 2025-26 & FY 2024-25)
 */
export const TAX_CONFIG = {
  FY_2025_26: {
    fy: 'FY_2025_26',
    yearLabel: 'FY 2025-26',
    assessmentYear: 'AY 2026-27',
    budgetLabel: 'Budget 2025 (Latest)',
    newRegime: {
      standardDeduction: 75000,
      rebate87ALimit: 1200000,
      rebate87AMax: 60000,
      slabs: [
        { min: 0, max: 400000, rate: 0.00, label: 'Up to ₹4 Lakhs' },
        { min: 400000, max: 800000, rate: 0.05, label: '₹4 Lakhs to ₹8 Lakhs' },
        { min: 800000, max: 1200000, rate: 0.10, label: '₹8 Lakhs to ₹12 Lakhs' },
        { min: 1200000, max: 1600000, rate: 0.15, label: '₹12 Lakhs to ₹16 Lakhs' },
        { min: 1600000, max: 2000000, rate: 0.20, label: '₹16 Lakhs to ₹20 Lakhs' },
        { min: 2000000, max: 2400000, rate: 0.25, label: '₹20 Lakhs to ₹24 Lakhs' },
        { min: 2400000, max: Infinity, rate: 0.30, label: 'Above ₹24 Lakhs' }
      ]
    },
    oldRegime: {
      standardDeduction: 50000,
      rebate87ALimit: 500000,
      rebate87AMax: 12500,
      slabs: [
        { min: 0, max: 250000, rate: 0.00, label: 'Up to ₹2.5 Lakhs' },
        { min: 250000, max: 500000, rate: 0.05, label: '₹2.5 Lakhs to ₹5 Lakhs' },
        { min: 500000, max: 1000000, rate: 0.20, label: '₹5 Lakhs to ₹10 Lakhs' },
        { min: 1000000, max: Infinity, rate: 0.30, label: 'Above ₹10 Lakhs' }
      ]
    }
  },
  FY_2024_25: {
    fy: 'FY_2024_25',
    yearLabel: 'FY 2024-25',
    assessmentYear: 'AY 2025-26',
    budgetLabel: 'Finance Act 2024',
    newRegime: {
      standardDeduction: 75000,
      rebate87ALimit: 700000,
      rebate87AMax: 20000,
      slabs: [
        { min: 0, max: 300000, rate: 0.00, label: 'Up to ₹3 Lakhs' },
        { min: 300000, max: 700000, rate: 0.05, label: '₹3 Lakhs to ₹7 Lakhs' },
        { min: 700000, max: 1000000, rate: 0.10, label: '₹7 Lakhs to ₹10 Lakhs' },
        { min: 1000000, max: 1200000, rate: 0.15, label: '₹10 Lakhs to ₹12 Lakhs' },
        { min: 1200000, max: 1500000, rate: 0.20, label: '₹12 Lakhs to ₹15 Lakhs' },
        { min: 1500000, max: Infinity, rate: 0.30, label: 'Above ₹15 Lakhs' }
      ]
    },
    oldRegime: {
      standardDeduction: 50000,
      rebate87ALimit: 500000,
      rebate87AMax: 12500,
      slabs: [
        { min: 0, max: 250000, rate: 0.00, label: 'Up to ₹2.5 Lakhs' },
        { min: 250000, max: 500000, rate: 0.05, label: '₹2.5 Lakhs to ₹5 Lakhs' },
        { min: 500000, max: 1000000, rate: 0.20, label: '₹5 Lakhs to ₹10 Lakhs' },
        { min: 1000000, max: Infinity, rate: 0.30, label: 'Above ₹10 Lakhs' }
      ]
    }
  }
};

function calculateRegimeTax(taxableIncome, regimeConfig, isNewRegime) {
  let slabTax = 0;
  const slabBreakdown = [];

  for (const slab of regimeConfig.slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
      const taxForSlab = taxableInSlab * slab.rate;
      slabTax += taxForSlab;
      slabBreakdown.push({
        label: slab.label,
        min: slab.min,
        max: slab.max,
        rate: slab.rate,
        taxableAmount: round2(taxableInSlab),
        tax: round2(taxForSlab)
      });
    } else {
      slabBreakdown.push({
        label: slab.label,
        min: slab.min,
        max: slab.max,
        rate: slab.rate,
        taxableAmount: 0,
        tax: 0
      });
    }
  }

  slabTax = round2(slabTax);

  // Section 87A Rebate & Marginal Relief
  let rebate87A = 0;
  let marginalRelief87A = 0;
  let taxAfterRebate = slabTax;

  if (taxableIncome <= regimeConfig.rebate87ALimit) {
    rebate87A = slabTax;
    taxAfterRebate = 0;
  } else if (isNewRegime) {
    // Proviso to Section 87A: Marginal relief in New Tax Regime
    // Tax payable before cess cannot exceed excess of taxable income over rebate limit
    const excessIncome = taxableIncome - regimeConfig.rebate87ALimit;
    if (slabTax > excessIncome) {
      marginalRelief87A = round2(slabTax - excessIncome);
      taxAfterRebate = round2(excessIncome);
    }
  }

  // Surcharge (Finance Acts 2024 / 2025)
  // New Regime: 50L-1Cr: 10%, 1Cr-2Cr: 15%, >2Cr: 25% (max 25%)
  // Old Regime: 50L-1Cr: 10%, 1Cr-2Cr: 15%, 2Cr-5Cr: 25%, >5Cr: 37%
  let surchargeRate = 0;
  let surchargeThreshold = 0;
  if (taxableIncome > 50000000) {
    surchargeRate = isNewRegime ? 0.25 : 0.37;
    surchargeThreshold = 50000000;
  } else if (taxableIncome > 20000000) {
    surchargeRate = 0.25;
    surchargeThreshold = 20000000;
  } else if (taxableIncome > 10000000) {
    surchargeRate = 0.15;
    surchargeThreshold = 10000000;
  } else if (taxableIncome > 5000000) {
    surchargeRate = 0.10;
    surchargeThreshold = 5000000;
  }

  let surcharge = round2(taxAfterRebate * surchargeRate);
  let marginalReliefSurcharge = 0;

  // Marginal relief on surcharge
  if (surchargeThreshold > 0 && surcharge > 0) {
    let taxAtThreshold = 0;
    for (const slab of regimeConfig.slabs) {
      if (surchargeThreshold > slab.min) {
        const amt = Math.min(surchargeThreshold, slab.max) - slab.min;
        taxAtThreshold += amt * slab.rate;
      }
    }
    let surchargeAtThreshold = 0;
    if (surchargeThreshold === 10000000) surchargeAtThreshold = taxAtThreshold * 0.10;
    else if (surchargeThreshold === 20000000) surchargeAtThreshold = taxAtThreshold * 0.15;
    else if (surchargeThreshold === 50000000) surchargeAtThreshold = taxAtThreshold * 0.25;

    const maxAllowableTaxAndSurcharge = taxAtThreshold + surchargeAtThreshold + (taxableIncome - surchargeThreshold);
    const currentTaxAndSurcharge = taxAfterRebate + surcharge;
    if (currentTaxAndSurcharge > maxAllowableTaxAndSurcharge) {
      marginalReliefSurcharge = round2(currentTaxAndSurcharge - maxAllowableTaxAndSurcharge);
      surcharge = round2(Math.max(0, surcharge - marginalReliefSurcharge));
    }
  }

  // Health and Education Cess: 4% on (Tax + Surcharge)
  const taxableForCess = taxAfterRebate + surcharge;
  const cess = round2(taxableForCess * 0.04);
  const totalTax = round2(taxableForCess + cess);

  return {
    slabTax,
    rebate87A,
    marginalRelief87A,
    taxAfterRebate,
    surcharge,
    marginalReliefSurcharge,
    cess,
    totalTax,
    slabBreakdown
  };
}

export function calculateIncomeTax(grossIncome, totalDeductions = 0, regime = 'new', fy = 'FY_2025_26') {
  const gross = Math.max(0, Number(grossIncome) || 0);
  const ded = Math.max(0, Number(totalDeductions) || 0);
  const activeFY = TAX_CONFIG[fy] ? fy : 'FY_2025_26';
  const fyConfig = TAX_CONFIG[activeFY];

  // 1. New Regime
  const stdDedNew = Math.min(fyConfig.newRegime.standardDeduction, gross);
  const taxableNew = Math.max(0, gross - stdDedNew);
  const newCalc = calculateRegimeTax(taxableNew, fyConfig.newRegime, true);

  // 2. Old Regime
  const stdDedOld = Math.min(fyConfig.oldRegime.standardDeduction, gross);
  const taxableOld = Math.max(0, gross - stdDedOld - ded);
  const oldCalc = calculateRegimeTax(taxableOld, fyConfig.oldRegime, false);

  const totalTaxNew = newCalc.totalTax;
  const totalTaxOld = oldCalc.totalTax;

  const selectedTax = regime === 'new' ? totalTaxNew : totalTaxOld;
  const effectiveRate = gross > 0 ? round2((selectedTax / gross) * 100) : 0;
  const netTakeHome = round2(gross - selectedTax);

  return {
    grossIncome: round2(gross),
    financialYear: activeFY,
    financialYearLabel: fyConfig.yearLabel,
    regime,
    newRegime: {
      standardDeduction: round2(stdDedNew),
      taxableIncome: round2(taxableNew),
      slabTax: newCalc.slabTax,
      rebate87A: newCalc.rebate87A,
      marginalRelief87A: newCalc.marginalRelief87A,
      taxAfterRebate: newCalc.taxAfterRebate,
      surcharge: newCalc.surcharge,
      marginalReliefSurcharge: newCalc.marginalReliefSurcharge,
      cess: newCalc.cess,
      totalTax: totalTaxNew,
      effectiveRate: gross > 0 ? round2((totalTaxNew / gross) * 100) : 0,
      takeHome: round2(gross - totalTaxNew),
      slabBreakdown: newCalc.slabBreakdown
    },
    oldRegime: {
      standardDeduction: round2(stdDedOld),
      deductions: round2(ded),
      taxableIncome: round2(taxableOld),
      slabTax: oldCalc.slabTax,
      rebate87A: oldCalc.rebate87A,
      taxAfterRebate: oldCalc.taxAfterRebate,
      surcharge: oldCalc.surcharge,
      marginalReliefSurcharge: oldCalc.marginalReliefSurcharge,
      cess: oldCalc.cess,
      totalTax: totalTaxOld,
      effectiveRate: gross > 0 ? round2((totalTaxOld / gross) * 100) : 0,
      takeHome: round2(gross - totalTaxOld),
      slabBreakdown: oldCalc.slabBreakdown
    },
    recommendedRegime: totalTaxNew <= totalTaxOld ? 'New Regime' : 'Old Regime',
    savingsWithRecommended: round2(Math.abs(totalTaxNew - totalTaxOld)),
    selectedTax,
    effectiveRate,
    netTakeHome
  };
}

/**
 * 19. GST Calculator (Add GST vs Remove GST)
 */
export function calculateGST(amount, ratePercent = 18, mode = 'add') {
  const A = Math.max(0, Number(amount) || 0);
  const r = Math.max(0, Number(ratePercent) || 0) / 100;

  if (mode === 'add') {
    const gstAmount = round2(A * r);
    const totalAmount = round2(A + gstAmount);
    const cgst = round2(gstAmount / 2);
    const sgst = round2(gstAmount / 2);
    return {
      netAmount: round2(A),
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      ratePercent
    };
  } else {
    // Remove GST: Total = Net * (1 + r) => Net = Total / (1 + r)
    const netAmount = round2(A / (1 + r));
    const gstAmount = round2(A - netAmount);
    const cgst = round2(gstAmount / 2);
    const sgst = round2(gstAmount / 2);
    return {
      netAmount,
      gstAmount,
      totalAmount: round2(A),
      cgst,
      sgst,
      ratePercent
    };
  }
}

/**
 * 20. Take-Home / In-Hand Salary Calculator
 */
export function calculateTakeHomeSalary(annualCTC, basicSalaryPct = 40, hraPct = 20, annualBonus = 0, fy = 'FY_2025_26') {
  const ctc = Math.max(0, Number(annualCTC) || 0);
  const basicPct = Math.max(10, Number(basicSalaryPct) || 40) / 100;
  const basic = ctc * basicPct;

  // PF (Employee + Employer 12% of basic each, standard statutory limit 1800/mo = 21,600/yr or 12%)
  const employeePFAnnual = Math.min(basic * 0.12, 1800 * 12);
  const employerPFAnnual = employeePFAnnual;
  const professionalTaxAnnual = 2400; // standard approx

  // Taxable salary = CTC - Employer PF
  const taxableGross = Math.max(0, ctc - employerPFAnnual);
  const taxRes = calculateIncomeTax(taxableGross, employeePFAnnual + 50000, 'new', fy);
  const annualTax = taxRes.selectedTax;

  const totalDeductions = round2(employeePFAnnual + employerPFAnnual + professionalTaxAnnual + annualTax);
  const netAnnualSalary = round2(Math.max(0, ctc - totalDeductions));
  const netMonthlySalary = round2(netAnnualSalary / 12);

  return {
    annualCTC: round2(ctc),
    monthlyGross: round2(ctc / 12),
    netAnnualSalary,
    netMonthlySalary,
    employeePFMonthly: round2(employeePFAnnual / 12),
    employerPFMonthly: round2(employerPFAnnual / 12),
    professionalTaxMonthly: round2(professionalTaxAnnual / 12),
    taxMonthly: round2(annualTax / 12),
    totalDeductionsMonthly: round2(totalDeductions / 12),
    annualTax: round2(annualTax),
    taxDetails: taxRes
  };
}

/**
 * 21. Profit Margin & Markup Calculator
 */
export function calculateProfitMargin(costPrice, sellingPrice, units = 1) {
  const cp = Math.max(0, Number(costPrice) || 0);
  const sp = Math.max(0, Number(sellingPrice) || 0);
  const n = Math.max(1, Number(units) || 1);

  const profitPerUnit = round2(sp - cp);
  const totalProfit = round2(profitPerUnit * n);
  const grossMarginPct = sp > 0 ? round2((profitPerUnit / sp) * 100) : 0;
  const markupPct = cp > 0 ? round2((profitPerUnit / cp) * 100) : 0;
  const totalRevenue = round2(sp * n);
  const totalCost = round2(cp * n);

  return {
    costPrice: round2(cp),
    sellingPrice: round2(sp),
    profitPerUnit,
    totalProfit,
    grossMarginPct,
    markupPct,
    totalRevenue,
    totalCost
  };
}

/**
 * 22. Break-Even Analysis Calculator
 */
export function calculateBreakEven(fixedCosts, variableCostPerUnit, salesPricePerUnit) {
  const FC = Math.max(0, Number(fixedCosts) || 0);
  const VC = Math.max(0, Number(variableCostPerUnit) || 0);
  const P = Math.max(0.01, Number(salesPricePerUnit) || 1);

  const contributionMargin = Math.max(0, P - VC);
  const cmRatio = round2((contributionMargin / P) * 100);

  let breakEvenUnits = 0;
  let breakEvenRevenue = 0;

  if (contributionMargin > 0) {
    breakEvenUnits = Math.ceil(FC / contributionMargin);
    breakEvenRevenue = round2(breakEvenUnits * P);
  }

  return {
    fixedCosts: round2(FC),
    variableCostPerUnit: round2(VC),
    salesPricePerUnit: round2(P),
    contributionMargin: round2(contributionMargin),
    cmRatio,
    breakEvenUnits,
    breakEvenRevenue
  };
}

/**
 * 23. Net Worth Calculator (Assets vs Liabilities)
 */
export function calculateNetWorth(assets = {}, liabilities = {}) {
  const cash = Number(assets.cash) || 0;
  const realEstate = Number(assets.realEstate) || 0;
  const investments = Number(assets.investments) || 0;
  const retirement = Number(assets.retirement) || 0;
  const vehicles = Number(assets.vehicles) || 0;
  const otherAssets = Number(assets.other) || 0;

  const totalAssets = round2(cash + realEstate + investments + retirement + vehicles + otherAssets);

  const mortgage = Number(liabilities.mortgage) || 0;
  const autoLoans = Number(liabilities.autoLoans) || 0;
  const studentLoans = Number(liabilities.studentLoans) || 0;
  const creditCards = Number(liabilities.creditCards) || 0;
  const otherDebts = Number(liabilities.other) || 0;

  const totalLiabilities = round2(mortgage + autoLoans + studentLoans + creditCards + otherDebts);
  const netWorth = round2(totalAssets - totalLiabilities);
  const liquidAssets = round2(cash + investments);
  const debtToAssetRatio = totalAssets > 0 ? round2((totalLiabilities / totalAssets) * 100) : 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidAssets,
    debtToAssetRatio,
    assetsBreakdown: [
      { label: 'Cash & Bank', value: cash, percent: totalAssets > 0 ? round2((cash / totalAssets) * 100) : 0 },
      { label: 'Investments & Stocks', value: investments, percent: totalAssets > 0 ? round2((investments / totalAssets) * 100) : 0 },
      { label: 'Real Estate', value: realEstate, percent: totalAssets > 0 ? round2((realEstate / totalAssets) * 100) : 0 },
      { label: 'Retirement Accounts', value: retirement, percent: totalAssets > 0 ? round2((retirement / totalAssets) * 100) : 0 },
      { label: 'Other Assets', value: vehicles + otherAssets, percent: totalAssets > 0 ? round2(((vehicles + otherAssets) / totalAssets) * 100) : 0 }
    ],
    liabilitiesBreakdown: [
      { label: 'Mortgage', value: mortgage },
      { label: 'Credit Cards', value: creditCards },
      { label: 'Student Loans', value: studentLoans },
      { label: 'Auto Loans', value: autoLoans },
      { label: 'Other Debt', value: otherDebts }
    ]
  };
}

/**
 * 24. 50/30/20 Budget Planner
 */
export function calculateBudget50_30_20(monthlyIncome, needsPct = 50, wantsPct = 30, savingsPct = 20) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const nPct = needsPct !== undefined && !isNaN(Number(needsPct)) ? Number(needsPct) : 50;
  const wPct = wantsPct !== undefined && !isNaN(Number(wantsPct)) ? Number(wantsPct) : 30;
  const sPct = savingsPct !== undefined && !isNaN(Number(savingsPct)) ? Number(savingsPct) : 20;

  const needsAmount = round2(income * (nPct / 100));
  const wantsAmount = round2(income * (wPct / 100));
  const savingsAmount = round2(income * (sPct / 100));

  return {
    monthlyIncome: round2(income),
    annualIncome: round2(income * 12),
    needsAmount,
    wantsAmount,
    savingsAmount,
    needsPct: nPct,
    wantsPct: wPct,
    savingsPct: sPct
  };
}

/**
 * 25. Buy vs. Rent Comparison Calculator
 * Supports both options object and positional arguments.
 * Models symmetric opportunity cost for monthly cash flow differential.
 */
export function calculateBuyVsRent(arg1 = {}, ...rest) {
  let propertyPrice = 500000;
  let downPaymentPct = 20;
  let loanRate = 6.5;
  let loanTenureYears = 30;
  let propertyAppreciation = 4.0;
  let propertyTaxRate = 1.2;
  let maintenanceRate = 1.0;
  let monthlyRent = 2200;
  let rentInflation = 3.5;
  let investmentReturn = 9.0;
  let horizonYears = 15;

  if (typeof arg1 === 'object' && arg1 !== null) {
    if (arg1.propertyPrice !== undefined) propertyPrice = Number(arg1.propertyPrice);
    else if (arg1.homePrice !== undefined) propertyPrice = Number(arg1.homePrice);

    if (arg1.downPaymentPct !== undefined) downPaymentPct = Number(arg1.downPaymentPct);
    else if (arg1.downPaymentPercent !== undefined) downPaymentPct = Number(arg1.downPaymentPercent);

    if (arg1.loanRate !== undefined) loanRate = Number(arg1.loanRate);
    else if (arg1.mortgageRate !== undefined) loanRate = Number(arg1.mortgageRate);
    else if (arg1.interestRate !== undefined) loanRate = Number(arg1.interestRate);

    if (arg1.loanTenureYears !== undefined) loanTenureYears = Number(arg1.loanTenureYears);
    else if (arg1.mortgageYears !== undefined) loanTenureYears = Number(arg1.mortgageYears);

    if (arg1.propertyAppreciation !== undefined) propertyAppreciation = Number(arg1.propertyAppreciation);
    else if (arg1.homeAppreciationRate !== undefined) propertyAppreciation = Number(arg1.homeAppreciationRate);
    else if (arg1.appreciationRate !== undefined) propertyAppreciation = Number(arg1.appreciationRate);

    if (arg1.propertyTaxRate !== undefined) propertyTaxRate = Number(arg1.propertyTaxRate);
    if (arg1.maintenanceRate !== undefined) maintenanceRate = Number(arg1.maintenanceRate);

    if (arg1.monthlyRent !== undefined) monthlyRent = Number(arg1.monthlyRent);

    if (arg1.rentInflation !== undefined) rentInflation = Number(arg1.rentInflation);
    else if (arg1.rentInflationRate !== undefined) rentInflation = Number(arg1.rentInflationRate);
    else if (arg1.rentIncreaseRate !== undefined) rentInflation = Number(arg1.rentIncreaseRate);

    if (arg1.investmentReturn !== undefined) investmentReturn = Number(arg1.investmentReturn);
    else if (arg1.investmentReturnRate !== undefined) investmentReturn = Number(arg1.investmentReturnRate);

    if (arg1.horizonYears !== undefined) horizonYears = Number(arg1.horizonYears);
    else if (arg1.timeHorizonYears !== undefined) horizonYears = Number(arg1.timeHorizonYears);
    else if (arg1.analysisYears !== undefined) horizonYears = Number(arg1.analysisYears);
  } else if (typeof arg1 === 'number' || rest.length > 0) {
    // Positional signature:
    // (homePrice, downPaymentPct, mortgageRate, mortgageYears, homeAppreciationRate, monthlyRent, rentInflationRate, investmentReturnRate, timeHorizonYears)
    propertyPrice = Number(arg1) || 0;
    if (rest[0] !== undefined) downPaymentPct = Number(rest[0]);
    if (rest[1] !== undefined) loanRate = Number(rest[1]);
    if (rest[2] !== undefined) loanTenureYears = Number(rest[2]);
    if (rest[3] !== undefined) propertyAppreciation = Number(rest[3]);
    if (rest[4] !== undefined) monthlyRent = Number(rest[4]);
    if (rest[5] !== undefined) rentInflation = Number(rest[5]);
    if (rest[6] !== undefined) investmentReturn = Number(rest[6]);
    if (rest[7] !== undefined) horizonYears = Number(rest[7]);
  }

  const P = Math.max(0, propertyPrice);
  const dpPct = Math.max(0, downPaymentPct) / 100;
  const initialDownPayment = P * dpPct;
  const loanAmount = Math.max(0, P - initialDownPayment);

  const emiData = calculateEMI(loanAmount, loanRate, Math.max(1, loanTenureYears * 12));
  const monthlyMortgage = loanAmount > 0 ? emiData.monthlyEMI : 0;

  let homeValue = P;
  let loanBal = loanAmount;
  let totalCostToBuy = initialDownPayment;
  let buyerSavingsPortfolio = 0;

  // Rent scenario: invest initial down payment
  let renterPortfolio = initialDownPayment;
  let curRent = Math.max(0, monthlyRent);
  let totalCostToRent = 0;

  const rPropApp = propertyAppreciation / 100;
  const rRentInf = rentInflation / 100;
  const rInvMo = (investmentReturn / 100) / 12;
  const rLoanMo = (loanRate / 100) / 12;

  const trajectory = [];

  for (let yr = 1; yr <= horizonYears; yr++) {
    // 12 months simulation
    for (let m = 1; m <= 12; m++) {
      // Buy costs: mortgage + tax + maintenance
      const moTax = (homeValue * (propertyTaxRate / 100)) / 12;
      const moMaint = (homeValue * (maintenanceRate / 100)) / 12;
      const totalBuyMonth = monthlyMortgage + moTax + moMaint;
      totalCostToBuy += totalBuyMonth;

      // Mortgage interest & principal
      if (loanBal > 0) {
        const intMo = loanBal * rLoanMo;
        const princMo = Math.min(loanBal, Math.max(0, monthlyMortgage - intMo));
        loanBal = Math.max(0, loanBal - princMo);
      }

      // Rent costs
      totalCostToRent += curRent;

      // Symmetric cash flow opportunity cost:
      // If buying costs more this month, renter invests the difference.
      // If renting costs more this month, buyer invests the difference.
      if (totalBuyMonth > curRent) {
        const renterSavings = totalBuyMonth - curRent;
        renterPortfolio = (renterPortfolio + renterSavings) * (1 + rInvMo);
        buyerSavingsPortfolio = buyerSavingsPortfolio * (1 + rInvMo);
      } else {
        const buyerSavings = curRent - totalBuyMonth;
        renterPortfolio = renterPortfolio * (1 + rInvMo);
        buyerSavingsPortfolio = (buyerSavingsPortfolio + buyerSavings) * (1 + rInvMo);
      }
    }

    // Year-end updates
    homeValue = homeValue * (1 + rPropApp);
    const homeEquity = Math.max(0, homeValue - loanBal);
    curRent = curRent * (1 + rRentInf);

    const buyerNetWorth = homeEquity + buyerSavingsPortfolio;
    const renterNetWorth = renterPortfolio;

    trajectory.push({
      year: yr,
      homeValue: round2(homeValue),
      homeEquity: round2(homeEquity),
      buyerSavingsPortfolio: round2(buyerSavingsPortfolio),
      buyerNetWorth: round2(buyerNetWorth),
      renterNetWorth: round2(renterNetWorth),
      totalCostToBuy: round2(totalCostToBuy),
      totalCostToRent: round2(totalCostToRent)
    });
  }

  const finalBuyerNetWorth = round2(trajectory[trajectory.length - 1]?.buyerNetWorth || (homeValue - loanBal));
  const finalRenterNetWorth = round2(renterPortfolio);
  const netAdvantage = round2(Math.abs(finalBuyerNetWorth - finalRenterNetWorth));
  const winner = finalBuyerNetWorth >= finalRenterNetWorth ? 'Buying' : 'Renting';

  return {
    initialDownPayment: round2(initialDownPayment),
    monthlyMortgage: round2(monthlyMortgage),
    finalHomeValue: round2(homeValue),
    finalBuyerNetWorth,
    finalRenterNetWorth,
    netAdvantage,
    winner,
    horizonYears,
    trajectory
  };
}

/**
 * 26. Inflation & Purchasing Power
 */
export function calculateInflation(amount, inflationRate, years, direction = 'future_cost') {
  const A = Math.max(0, Number(amount) || 0);
  const r = Math.max(0, Number(inflationRate) || 0) / 100;
  const t = Math.max(0.1, Number(years) || 1);

  if (A === 0) {
    return {
      initialAmount: 0,
      adjustedAmount: 0,
      purchasingPowerLossPct: 0,
      yearlyBreakdown: []
    };
  }

  const futureCost = round2(A * Math.pow(1 + r, t));
  const purchasingPower = round2(A / Math.pow(1 + r, t));
  const adjustedAmount = direction === 'purchasing_power' ? purchasingPower : futureCost;
  const purchasingPowerLossPct = round2((1 - purchasingPower / A) * 100);

  const totalYears = Math.ceil(t);
  const yearlyBreakdown = [];

  for (let y = 1; y <= totalYears; y++) {
    const curY = y <= Math.floor(t) ? y : t;
    const cost = round2(A * Math.pow(1 + r, curY));
    const power = round2(A / Math.pow(1 + r, curY));

    yearlyBreakdown.push({
      year: y,
      futureCost: cost,
      purchasingPower: power
    });
  }

  return {
    initialAmount: round2(A),
    adjustedAmount,
    purchasingPowerLossPct,
    yearlyBreakdown
  };
}

/**
 * 27. FIRE (Financial Independence, Retire Early) & Retirement Corpus
 */
export function calculateFIRE(
  currentAge,
  targetAge,
  currentSavings,
  monthlyExpenses,
  inflationRate,
  expectedReturn,
  swrPercent = 4.0
) {
  const ageNow = Math.max(18, Number(currentAge) || 30);
  const ageRetire = Math.max(ageNow + 1, Number(targetAge) || 50);
  const yearsToRetire = ageRetire - ageNow;

  const savingsNow = Math.max(0, Number(currentSavings) || 0);
  const expMonthly = Math.max(0, Number(monthlyExpenses) || 0);
  const rInf = Math.max(0, Number(inflationRate) || 0) / 100;
  const rRet = Math.max(0, Number(expectedReturn) || 0) / 100;
  const swr = Math.max(0.01, (Number(swrPercent) || 4.0) / 100);

  const annualExpensesToday = expMonthly * 12;
  const futureAnnualExpenses = round2(annualExpensesToday * Math.pow(1 + rInf, yearsToRetire));

  const fireTarget = round2(futureAnnualExpenses / swr);
  const leanFireTarget = round2(fireTarget * 0.75);
  const fatFireTarget = round2(fireTarget * 1.30);
  const coastFireTarget = round2(fireTarget / Math.pow(1 + rRet, yearsToRetire));

  const futureSavingsAtTargetAge = round2(savingsNow * Math.pow(1 + rRet, yearsToRetire));
  const shortfall = round2(Math.max(0, fireTarget - futureSavingsAtTargetAge));

  let monthlySavingsRequired = 0;
  if (shortfall > 0 && yearsToRetire > 0) {
    const nMonths = yearsToRetire * 12;
    const rMonth = rRet / 12;
    if (rMonth === 0) {
      monthlySavingsRequired = round2(shortfall / nMonths);
    } else {
      const factor = Math.pow(1 + rMonth, nMonths);
      monthlySavingsRequired = round2((shortfall * rMonth) / ((factor - 1) * (1 + rMonth)));
    }
  }

  const yearlyTrajectory = [];
  let runningPortfolio = savingsNow;
  const monthlyDeposit = monthlySavingsRequired;
  const rMo = rRet / 12;

  for (let y = 0; y <= yearsToRetire; y++) {
    const age = ageNow + y;
    const expAtYear = annualExpensesToday * Math.pow(1 + rInf, y);
    const targetAtYear = expAtYear / swr;

    yearlyTrajectory.push({
      age,
      year: y,
      portfolioValue: round2(runningPortfolio),
      targetNeeded: round2(targetAtYear)
    });

    for (let m = 0; m < 12; m++) {
      runningPortfolio = (runningPortfolio + monthlyDeposit) * (1 + rMo);
    }
  }

  return {
    fireTarget,
    leanFireTarget,
    fatFireTarget,
    coastFireTarget,
    futureAnnualExpenses,
    futureSavingsAtTargetAge,
    shortfall,
    monthlySavingsRequired,
    yearsToRetirement: yearsToRetire,
    yearlyTrajectory
  };
}
