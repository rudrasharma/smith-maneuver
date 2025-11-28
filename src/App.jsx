import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine, ComposedChart, Cell } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, Calculator, Activity, ShieldAlert, Wallet } from 'lucide-react';

// --- DATA ENGINE ---

// Simplified Monthly Returns (Proxy: Annual / 12)
const HISTORICAL_RETURNS = {
  'US': { 
      1985: 31.7, 1986: 18.7, 1987: 5.2, 1988: 16.6, 1989: 31.7,
      1990: -3.1, 1991: 30.5, 1992: 7.6, 1993: 10.1, 1994: 1.3,
      1995: 37.6, 1996: 23.0, 1997: 33.4, 1998: 28.6, 1999: 21.0,
      2000: -9.1, 2001: -11.9, 2002: -22.1, 2003: 28.7, 2004: 10.9, 2005: 4.9, 2006: 15.8, 2007: 5.5, 2008: -37.0, 2009: 26.5,
      2010: 15.1, 2011: 2.1, 2012: 16.0, 2013: 32.4, 2014: 13.7, 2015: 1.4, 2016: 11.9, 2017: 21.8, 2018: -4.4, 2019: 31.5,
      2020: 18.4, 2021: 28.7, 2022: -18.1, 2023: 26.3, 2024: 21.0, 2025: 10.0
  },
  'CAD': {
      1985: 21.0, 1986: 5.7, 1987: 5.9, 1988: 11.1, 1989: 21.4,
      1990: -14.8, 1991: 12.0, 1992: -1.4, 1993: 32.6, 1994: -0.2,
      1995: 14.5, 1996: 28.4, 1997: 15.0, 1998: -1.6, 1999: 31.7,
      2000: 7.4, 2001: -12.6, 2002: -12.4, 2003: 26.7, 2004: 14.5, 2005: 24.1, 2006: 17.3, 2007: 9.8, 2008: -33.0, 2009: 35.1,
      2010: 17.6, 2011: -8.7, 2012: 7.2, 2013: 13.0, 2014: 10.6, 2015: -8.3, 2016: 21.1, 2017: 9.1, 2018: -8.9, 2019: 22.9,
      2020: 5.6, 2021: 25.1, 2022: -5.8, 2023: 11.8, 2024: 15.0, 2025: 8.0
  },
  'GLOBAL': { 
      1985: 41.0, 1986: 42.0, 1987: 16.0, 1988: 23.0, 1989: 16.0,
      1990: -17.0, 1991: 18.0, 1992: -5.0, 1993: 22.0, 1994: 5.0,
      1995: 20.0, 1996: 15.0, 1997: 18.0, 1998: 20.0, 1999: 25.0,
      2000: -10.0, 2001: -15.0, 2002: -18.0, 2003: 30.0, 2004: 12.0, 2005: 8.0, 2006: 18.0, 2007: 8.0, 2008: -40.0, 2009: 28.0,
      2010: 10.0, 2011: -5.0, 2012: 14.0, 2013: 25.0, 2014: 10.0, 2015: 2.0, 2016: 8.0, 2017: 20.0, 2018: -8.0, 2019: 25.0,
      2020: 14.0, 2021: 20.0, 2022: -16.0, 2023: 20.0, 2024: 18.0, 2025: 10.0
  }
};

// PRECISE RATE CHANGES (YYYY-MM-DD)
const RATE_CHANGES = [
  { date: '1985-01-01', prime: 11.25, boc: 9.66 },
  { date: '1985-05-22', prime: 10.50, boc: 9.60 },
  { date: '1986-01-01', prime: 10.00, boc: 9.50 },
  { date: '1987-01-01', prime: 9.75, boc: 8.50 },
  { date: '1988-01-01', prime: 9.75, boc: 8.65 },
  { date: '1988-12-01', prime: 12.25, boc: 11.17 },
  { date: '1989-03-01', prime: 13.50, boc: 12.40 },
  { date: '1990-01-01', prime: 14.25, boc: 13.00 }, 
  { date: '1990-08-01', prime: 14.75, boc: 13.50 },
  { date: '1991-01-01', prime: 12.75, boc: 11.50 },
  { date: '1992-01-01', prime: 8.00, boc: 7.00 },
  { date: '1993-01-01', prime: 6.00, boc: 5.00 }, 
  { date: '1994-01-01', prime: 5.50, boc: 4.00 },
  { date: '1995-01-01', prime: 8.00, boc: 6.50 },
  { date: '1995-06-01', prime: 8.75, boc: 7.25 },
  { date: '1996-01-01', prime: 7.50, boc: 6.00 },
  { date: '1997-01-01', prime: 4.75, boc: 3.25 },
  { date: '1998-01-01', prime: 6.50, boc: 5.00 },
  { date: '1998-09-01', prime: 7.50, boc: 6.00 }, 
  { date: '1999-01-01', prime: 6.75, boc: 5.25 },
  { date: '2000-01-01', prime: 6.50, boc: 5.00 },
  { date: '2000-05-17', prime: 7.50, boc: 6.00 },
  { date: '2001-01-01', prime: 7.50, boc: 5.75 },
  { date: '2001-10-23', prime: 4.50, boc: 2.75 }, 
  { date: '2002-01-15', prime: 3.75, boc: 2.00 },
  { date: '2002-04-16', prime: 4.00, boc: 2.25 },
  { date: '2003-07-15', prime: 4.75, boc: 3.00 },
  { date: '2004-01-20', prime: 4.00, boc: 2.25 },
  { date: '2004-09-08', prime: 4.25, boc: 2.50 },
  { date: '2005-09-07', prime: 4.50, boc: 2.75 },
  { date: '2006-05-24', prime: 6.00, boc: 4.25 },
  { date: '2007-07-10', prime: 6.25, boc: 4.50 },
  { date: '2007-12-04', prime: 6.00, boc: 4.25 }, 
  { date: '2008-01-22', prime: 5.75, boc: 4.00 },
  { date: '2008-10-08', prime: 4.00, boc: 2.50 }, 
  { date: '2008-12-09', prime: 3.50, boc: 1.50 },
  { date: '2009-01-20', prime: 3.00, boc: 1.00 },
  { date: '2009-04-21', prime: 2.25, boc: 0.25 }, 
  { date: '2010-06-01', prime: 2.50, boc: 0.50 },
  { date: '2010-09-08', prime: 3.00, boc: 1.00 },
  { date: '2015-01-21', prime: 2.85, boc: 0.75 }, 
  { date: '2015-07-15', prime: 2.70, boc: 0.50 },
  { date: '2017-07-12', prime: 2.95, boc: 0.75 }, 
  { date: '2017-09-06', prime: 3.20, boc: 1.00 },
  { date: '2018-01-17', prime: 3.45, boc: 1.25 },
  { date: '2018-07-11', prime: 3.70, boc: 1.50 },
  { date: '2018-10-24', prime: 3.95, boc: 1.75 },
  { date: '2020-03-04', prime: 3.45, boc: 1.25 },
  { date: '2020-03-16', prime: 2.95, boc: 0.75 },
  { date: '2020-03-27', prime: 2.45, boc: 0.25 }, 
  { date: '2022-03-02', prime: 2.70, boc: 0.50 }, 
  { date: '2022-04-13', prime: 3.20, boc: 1.00 },
  { date: '2022-06-01', prime: 3.70, boc: 1.50 },
  { date: '2022-07-13', prime: 4.70, boc: 2.50 }, 
  { date: '2022-09-07', prime: 5.45, boc: 3.25 },
  { date: '2022-10-26', prime: 5.95, boc: 3.75 },
  { date: '2022-12-07', prime: 6.45, boc: 4.25 },
  { date: '2023-01-25', prime: 6.70, boc: 4.50 },
  { date: '2023-06-07', prime: 6.95, boc: 4.75 },
  { date: '2023-07-12', prime: 7.20, boc: 5.00 }, 
  { date: '2024-06-05', prime: 6.95, boc: 4.75 }, 
  { date: '2024-07-24', prime: 6.70, boc: 4.50 },
  { date: '2024-09-04', prime: 6.45, boc: 4.25 },
  { date: '2024-10-23', prime: 5.95, boc: 3.75 },
  { date: '2024-12-11', prime: 5.45, boc: 3.25 },
  { date: '2025-01-29', prime: 5.20, boc: 3.00 },
  { date: '2025-03-12', prime: 4.95, boc: 2.75 },
  { date: '2025-09-17', prime: 4.70, boc: 2.50 },
  { date: '2025-10-29', prime: 4.45, boc: 2.25 }
];

const ETFS = [
  { ticker: 'XEQT', name: 'iShares Core Equity', avgYield: 1.9, proxy: 'GLOBAL', desc: "Global 100% Equity. Uses Global Index proxy before 2019." },
  { ticker: 'VEQT', name: 'Vanguard All-Equity', avgYield: 1.8, proxy: 'GLOBAL', desc: "Vanguard's version of XEQT. Global diversity." },
  { ticker: 'ZLB', name: 'BMO Low Vol Canadian', avgYield: 2.4, proxy: 'CAD', desc: "CDN Low Volatility. Uses TSX as proxy before 2011." },
  { ticker: 'XDIV', name: 'iShares Core Qual Div', avgYield: 4.1, proxy: 'CAD', desc: "CDN High Dividend. Uses TSX as proxy before 2017." },
  { ticker: 'VDY', name: 'Vanguard High Div', avgYield: 4.4, proxy: 'CAD', desc: "High Yield Canadian. Heavy in Banks/Energy." },
  { ticker: 'VCN', name: 'Vanguard Canada All Cap', avgYield: 2.9, proxy: 'CAD', desc: "Total Canadian Market. Lowest cost (0.05% MER)." },
  { ticker: 'VFV', name: 'Vanguard S&P 500', avgYield: 1.2, proxy: 'US', desc: "S&P 500 Index. Pure US market exposure." }
];

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "$0";
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
};

const getMonthlyRate = (year, month) => {
  const targetDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const rateObj = RATE_CHANGES.filter(r => r.date <= targetDate).pop();
  return rateObj || { prime: 11.25, boc: 9.66 };
};

export default function SmithManoeuvreApp() {
  const [selectedEtf, setSelectedEtf] = useState('XEQT');
  const [loanType, setLoanType] = useState('HELOC'); // HELOC | MARGIN
  const [initialInvestment, setInitialInvestment] = useState(0); // Borrowed amount
  const [marginEquity, setMarginEquity] = useState(50000); // Only for Margin
  const [marginEtf, setMarginEtf] = useState('XEQT'); // Only for Margin
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
  const [rateSpread, setRateSpread] = useState(0.0);
  const [taxRate, setTaxRate] = useState(50.0);
  const [startYear, setStartYear] = useState(1995);
  const [endYear, setEndYear] = useState(2025);
  const [reinvestDividends, setReinvestDividends] = useState(false);

  const yearOptions = useMemo(() => {
    const years = [];
    for(let y=1985; y<=2025; y++) years.push(y);
    return years;
  }, []);

  const simulationData = useMemo(() => {
    const strategyEtf = ETFS.find(e => e.ticker === selectedEtf) || ETFS[0];
    const collateralEtf = ETFS.find(e => e.ticker === marginEtf) || ETFS[0];

    let strategyPortfolio = initialInvestment || 0;
    let collateralPortfolio = loanType === 'MARGIN' ? (marginEquity || 0) : 0;
    let currentLoan = initialInvestment || 0;
    let accumInterest = 0;
    let accumRefunds = 0;
    let accumDividends = 0;
    let maxMonthly = 0;
    let marginCallMonths = 0;
    let totalForcedSales = 0;

    const dataPoints = [];
    
    const stressScenarios = [
      { name: "Dot Com Crash", start: 2000, end: 2003, detected: false, startEquity: 0, endEquity: 0 },
      { name: "Financial Crisis (GFC)", start: 2008, end: 2009, detected: false, startEquity: 0, endEquity: 0 },
      { name: "Rate Hike Spike", start: 2022, end: 2023, detected: false, startEquity: 0, endEquity: 0 }
    ];

    let rolling5YearMin = 1000000;
    let rolling5YearPeriod = "N/A";

    for (let y = startYear; y <= endYear; y++) {
      const stratReturn = HISTORICAL_RETURNS[strategyEtf.proxy][y] !== undefined ? HISTORICAL_RETURNS[strategyEtf.proxy][y] : 5.0;
      const colReturn = HISTORICAL_RETURNS[collateralEtf.proxy][y] !== undefined ? HISTORICAL_RETURNS[collateralEtf.proxy][y] : 5.0;
      
      const stratMonthlyGrowth = stratReturn / 100 / 12;
      const colMonthlyGrowth = colReturn / 100 / 12;
      
      const stratMonthlyYield = strategyEtf.avgYield / 100 / 12;
      const colMonthlyYield = collateralEtf.avgYield / 100 / 12;

      for (let m = 1; m <= 12; m++) {
        const { prime, boc } = getMonthlyRate(y, m);
        const effectiveRate = prime + rateSpread;

        const currentTotalPortfolio = strategyPortfolio + collateralPortfolio;
        // For margin call logic we need total portfolio value
        // For reporting, we will just use strategyPortfolio later
        const currentEquity = strategyPortfolio - currentLoan; // This is Strategy Equity

        stressScenarios.forEach(scen => {
          if (y === scen.start && m === 1) {
            scen.detected = true;
            scen.startEquity = currentEquity;
          }
        });

        const safeMonthlyInv = monthlyInvestment || 0;
        currentLoan += safeMonthlyInv;
        strategyPortfolio += safeMonthlyInv;

        strategyPortfolio = strategyPortfolio * (1 + stratMonthlyGrowth);
        collateralPortfolio = collateralPortfolio * (1 + colMonthlyGrowth);

        const stratDiv = strategyPortfolio * stratMonthlyYield;
        const colDiv = collateralPortfolio * colMonthlyYield;
        // accumDividends is for reporting "Total Dividends (Benefit)" 
        // User wants Collateral to be independent, so we ONLY track stratDiv for reporting
        accumDividends += stratDiv;
        
        if (reinvestDividends) {
          strategyPortfolio += stratDiv; 
          collateralPortfolio += colDiv; // Reinvest independently in background
        } else {
          // If not reinvesting, where does colDiv go? 
          // It's independent income, so we ignore it for the simulation's cash flow.
          // We only care about stratDiv reducing the loan cost.
        }

        const interest = currentLoan * (effectiveRate / 100 / 12);
        accumInterest += interest;
        const refund = interest * (taxRate / 100);
        accumRefunds += refund;

        let netCost = interest - refund;
        let cashDividend = 0;
        if (!reinvestDividends) {
          cashDividend = stratDiv; // Only use Strategy dividends to pay down loan interest
          netCost -= cashDividend;
        }
        
        if (netCost > maxMonthly) maxMonthly = netCost;

        const totalPortfolioVal = strategyPortfolio + collateralPortfolio;
        const currentLTV = totalPortfolioVal > 0 ? (currentLoan / totalPortfolioVal) * 100 : 0;
        
        if (loanType === 'MARGIN') {
          if (currentLTV > 70) {
            marginCallMonths++;
            const amountToSell = (2 * currentLoan) - totalPortfolioVal;
            
            if (amountToSell > 0) {
              totalForcedSales += amountToSell;
              currentLoan -= amountToSell;
              
              if (strategyPortfolio >= amountToSell) {
                strategyPortfolio -= amountToSell;
              } else {
                const remainder = amountToSell - strategyPortfolio;
                strategyPortfolio = 0;
                collateralPortfolio -= remainder;
                if (collateralPortfolio < 0) collateralPortfolio = 0;
              }
            }
          }
        } else {
          if (currentLTV > 70) marginCallMonths++; 
        }

        const finalEquity = strategyPortfolio - currentLoan;

        let currentRecovered = accumRefunds;
        if (!reinvestDividends) currentRecovered += accumDividends;
        let currentNetOutOfPocket = accumInterest - currentRecovered;
        let currentTrueProfit = finalEquity - currentNetOutOfPocket;

        dataPoints.push({
          date: `${y}-${String(m).padStart(2, '0')}`,
          year: y,
          month: m,
          portfolio: Math.round(strategyPortfolio), // Reporting Strategy Only
          loan: Math.round(currentLoan),
          netEquity: Math.round(finalEquity),
          netCost: Math.round(netCost),
          ltv: currentLTV,
          cumulativeNetOutOfPocket: Math.round(currentNetOutOfPocket),
          trueProfit: Math.round(currentTrueProfit),
          totalInterest: Math.round(accumInterest),
          totalRefunds: Math.round(accumRefunds),
          totalDividends: Math.round(accumDividends),
          interestExpense: Math.round(interest),
          taxRefund: Math.round(refund * -1),
          dividendIncome: Math.round(cashDividend * -1),
          primeRate: prime,
          bocRate: boc,
          marketReturn: stratReturn 
        });

        stressScenarios.forEach(scen => {
          if (y === scen.end && m === 12 && scen.detected) {
            scen.endEquity = finalEquity;
          }
        });
      }
    }

    if (dataPoints.length > 60) {
      for (let i = 60; i < dataPoints.length; i++) {
        const fiveYearProfit = dataPoints[i].trueProfit - dataPoints[i-60].trueProfit;
        if (fiveYearProfit < rolling5YearMin) {
          rolling5YearMin = fiveYearProfit;
          rolling5YearPeriod = `${dataPoints[i-60].date} to ${dataPoints[i].date}`;
        }
      }
    } else {
      rolling5YearMin = 0;
      rolling5YearPeriod = "N/A (< 5 yrs)";
    }

    let totalRecovered = accumRefunds;
    if (!reinvestDividends) totalRecovered += accumDividends;
    const netOutOfPocket = accumInterest - totalRecovered;
    
    const netEquity = strategyPortfolio - currentLoan;
    const trueProfit = netEquity - netOutOfPocket;

    return {
      data: dataPoints,
      stats: {
        portfolio: strategyPortfolio,
        loan: currentLoan,
        netEquity,
        trueProfit,
        netOutOfPocket,
        maxMonthly,
        stressScenarios,
        rolling5YearMin,
        rolling5YearPeriod,
        marginCallMonths,
        totalForcedSales
      }
    };
  }, [selectedEtf, loanType, marginEquity, marginEtf, initialInvestment, monthlyInvestment, rateSpread, taxRate, startYear, endYear, reinvestDividends]);

  const currentEtfInfo = ETFS.find(e => e.ticker === selectedEtf) || ETFS[0];

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
      <style>{`
        :root, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; background-color: #f9fafb; }
        body { display: block !important; place-items: unset !important; }
      `}</style>
      
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Smith Manoeuvre Backtest
          </h1>
          <p className="text-slate-500 mt-1">Historical simulation engine (1985 - 2025)</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-slate-600">
          <span className="font-semibold text-blue-600">Live Context:</span> Canadian Prime Rate 2025 used for projection.
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT CONTROLS --- */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* CONFIG CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Configuration</h2>
            
            <div className="space-y-5">
              
              {/* LOAN TYPE TOGGLE */}
              <div className="p-3 bg-slate-100 rounded-lg flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Loan Structure</label>
                <div className="flex gap-2">
                  <button onClick={() => setLoanType('HELOC')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${loanType === 'HELOC' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-200'}`}>HELOC</button>
                  <button onClick={() => setLoanType('MARGIN')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${loanType === 'MARGIN' ? 'bg-orange-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-200'}`}>Margin</button>
                </div>
              </div>

              {/* ETF SELECTOR */}
              <div>
                <label className="block text-sm font-semibold mb-1">Target Strategy ETF</label>
                <select value={selectedEtf} onChange={(e) => setSelectedEtf(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  {ETFS.map(e => (<option key={e.ticker} value={e.ticker}>{e.ticker} - {e.name}</option>))}
                </select>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{currentEtfInfo.desc}</p>
              </div>

              {/* MARGIN SPECIFIC INPUTS */}
              {loanType === 'MARGIN' && (
                <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-orange-800 mb-1">
                    <DollarSign size={14} />
                    <span className="text-xs font-bold uppercase">Pledged Collateral</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-900 mb-1">Initial Equity ($)</label>
                    <input type="number" value={marginEquity} onChange={(e) => setMarginEquity(Number(e.target.value))} className="w-full p-2 bg-white border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-900 mb-1">Held In (ETF)</label>
                    <select value={marginEtf} onChange={(e) => setMarginEtf(e.target.value)} className="w-full p-2 bg-white border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                      {ETFS.map(e => (<option key={e.ticker} value={e.ticker}>{e.ticker}</option>))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">{loanType === 'HELOC' ? 'Initial Investment (Lump Sum)' : 'Initial Loan Amount'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(Number(e.target.value))} className="w-full pl-6 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Monthly Borrowing</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input type="number" value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(Number(e.target.value))} className="w-full pl-6 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Interest Rate (Prime +/-)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">%</span>
                    <input type="number" step="0.1" value={rateSpread} onChange={(e) => setRateSpread(Number(e.target.value))} className="w-full pl-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Marginal Tax Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">%</span>
                  <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-full pl-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500">Start Year</label>
                  <select value={startYear} onChange={(e) => { const val = Number(e.target.value); setStartYear(val); if(endYear < val) setEndYear(val); }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500">End Year</label>
                  <select value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    {yearOptions.filter(y => y >= startYear).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor="drip">Reinvest Dividends?</label>
                <input id="drip" type="checkbox" checked={reinvestDividends} onChange={(e) => setReinvestDividends(e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-6">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calculator size={16} /> Net Cost Formula
            </h2>
            <div className="text-xs text-indigo-800 space-y-2 font-mono">
              <div className="flex justify-between"><span>Interest Bill</span><span className="text-red-500 font-bold">(+)</span></div>
              <div className="flex justify-between"><span>Tax Refund</span><span className="text-green-600 font-bold">(-)</span></div>
              <div className={`flex justify-between ${reinvestDividends ? 'opacity-40 line-through' : ''}`}><span>Dividend Check</span><span className="text-blue-600 font-bold">(-)</span></div>
              <div className="h-px bg-indigo-200 w-full my-1"></div>
              <div className="flex justify-between font-bold text-sm"><span>Net Out-of-Pocket</span><span>=</span></div>
            </div>
            {reinvestDividends && <p className="text-[10px] text-indigo-500 mt-2 italic">*Dividends are currently reinvested (DRIP), so they do not reduce monthly cost.</p>}
          </div>

          <div className={`rounded-xl shadow-sm border p-6 ${loanType === 'MARGIN' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${loanType === 'MARGIN' ? 'text-orange-900' : 'text-slate-500'}`}>
              <ShieldAlert size={16} /> Margin Call Risk
            </h2>
            <div className={`text-xs space-y-3 ${loanType === 'MARGIN' ? 'text-orange-800' : 'text-slate-500'}`}>
              <p className="leading-relaxed">{loanType === 'MARGIN' ? "Margin calls trigger forced asset sales when LTV > 70%, locking in losses permanently." : "HELOCs are typically not callable based on LTV fluctuations, reducing risk significantly."}</p>
              <div className="flex justify-between items-center bg-white p-2 rounded border border-orange-200">
                <span className="font-semibold">Months in Margin Call:</span>
                <span className={`font-bold text-lg ${simulationData.stats.marginCallMonths > 0 ? 'text-red-600' : 'text-slate-700'}`}>{simulationData.stats.marginCallMonths}</span>
              </div>
              {loanType === 'MARGIN' && simulationData.stats.totalForcedSales > 0 && (
                <div className="flex justify-between items-center bg-white p-2 rounded border border-red-200">
                  <span className="font-semibold text-red-700">Forced Sales Value:</span>
                  <span className="font-bold text-red-600">{formatCurrency(simulationData.stats.totalForcedSales)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Activity size={16} /> Stress Test (Worst 5 Yrs)
            </h2>
            <div className="text-sm text-amber-800">
              <div className="flex justify-between items-center mb-1">
                <span>Worst Rolling Profit:</span>
                <span className="font-bold text-red-600">{formatCurrency(simulationData.stats.rolling5YearMin)}</span>
              </div>
              <div className="text-xs text-amber-600 mb-3 text-right">{simulationData.stats.rolling5YearPeriod}</div>
              <div className="h-px bg-amber-200 w-full my-2"></div>
              <div className="space-y-2 mt-2">
                {simulationData.stats.stressScenarios.map(scen => (
                  scen.detected && (
                    <div key={scen.name} className="flex justify-between text-xs">
                      <span>{scen.name}:</span>
                      <span className={`font-bold ${scen.endEquity - scen.startEquity >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(scen.endEquity - scen.startEquity)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-xl shadow-sm border border-rose-100 p-6">
            <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> Cash Flow Risk
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-rose-800">Net Out-of-Pocket</span>
                <span className={`font-bold text-lg ${simulationData.stats.netOutOfPocket > 0 ? 'text-rose-600' : 'text-green-600'}`}>{formatCurrency(simulationData.stats.netOutOfPocket)}</span>
              </div>
              <div className="h-px bg-rose-200 w-full"></div>
              <div>
                <p className="text-xs text-rose-800 font-bold uppercase mb-1">Max Monthly Pain</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-rose-700">{formatCurrency(simulationData.stats.maxMonthly)}</span>
                  <span className="text-xs text-rose-500 mb-1">/ month</span>
                </div>
                <p className="text-xs text-rose-600 mt-1 leading-tight opacity-80">Highest monthly cost you had to pay during a rate spike (e.g. 2023).</p>
              </div>
            </div>
          </div>

        </div>

        {/* --- RIGHT CONTENT --- */}
        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Portfolio Value</p>
              <p className="text-2xl font-extrabold text-green-600 mt-1">{formatCurrency(simulationData.stats.portfolio)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Loan Balance</p>
              <p className="text-2xl font-extrabold text-red-500 mt-1">({formatCurrency(simulationData.stats.loan)})</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase">True Profit (After Costs)</p>
                  <p className={`text-2xl font-extrabold mt-1 ${simulationData.stats.trueProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatCurrency(simulationData.stats.trueProfit)}</p>
                </div>
                <DollarSign className="text-blue-300" />
              </div>
              <p className="text-xs text-blue-400 mt-1">Equity - Net Interest Paid</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Net Worth & Profit Analysis</h3>
              <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Interactive</div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulationData.data}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => formatCurrency(val)} labelFormatter={(label) => `Date: ${label}`} itemSorter={(item) => (item.name === 'True Profit' ? -1 : 1)} />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine x="2008-10" stroke="red" strokeDasharray="3 3" label={{ value: 'GFC', position: 'insideTopLeft', fontSize: 10, fill: 'red' }} />
                  <ReferenceLine x="2020-03" stroke="orange" strokeDasharray="3 3" label={{ value: 'Covid', position: 'insideTopLeft', fontSize: 10, fill: 'orange' }} />
                  <Area type="monotone" dataKey="netEquity" stroke="#2563eb" fillOpacity={1} fill="url(#colorEquity)" name="Net Equity (Portfolio - Loan)" />
                  <Line type="monotone" dataKey="cumulativeNetOutOfPocket" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Net Cost (Cumulative)" />
                  <Line type="monotone" dataKey="trueProfit" stroke="#16a34a" strokeWidth={3} dot={false} name="True Profit (Equity - Cost)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Total Assets vs. Loan</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => formatCurrency(val)} labelFormatter={(label) => `Date: ${label}`} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="portfolio" stroke="#059669" strokeWidth={3} dot={false} name="Portfolio Value" />
                  <Line type="monotone" dataKey="loan" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Loan Balance" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Loan-to-Value Ratio (Risk)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${Math.round(val)}%`} domain={[0, 150]} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => `${val.toFixed(1)}%`} labelFormatter={(label) => `Date: ${label}`} />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine y={100} stroke="#000" strokeWidth={2} label={{ value: 'UNDERWATER (>100%)', position: 'insideBottomRight', fill: 'black', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'MARGIN CALL (>70%)', position: 'insideBottomRight', fill: 'red', fontSize: 10, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="ltv" stroke="#f59e0b" strokeWidth={2} dot={false} name="LTV %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center italic">Shows why HELOC (House Security) is required. A Margin Loan (Stock Security) would trigger calls above 70% LTV.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Annual Market Return (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationData.data.filter((_, i) => i % 12 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => `${val}%`} />
                  <ReferenceLine y={0} stroke="#000" />
                  <Bar dataKey="marketReturn" name="Return %">
                    {simulationData.data.filter((_, i) => i % 12 === 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.marketReturn > 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Cash Flow Breakdown (Cost vs. Offsets)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulationData.data} stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val}`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => formatCurrency(val)} labelFormatter={(label) => `Date: ${label}`} />
                  <ReferenceLine y={0} stroke="#000" />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="interestExpense" fill="#ef4444" name="Interest Cost (+)" stackId="a" />
                  <Bar dataKey="taxRefund" fill="#10b981" name="Tax Refund (-)" stackId="a" />
                  {!reinvestDividends && <Bar dataKey="dividendIncome" fill="#3b82f6" name="Dividend Check (-)" stackId="a" />}
                  <Line type="monotone" dataKey="netCost" stroke="#111827" strokeWidth={2} dot={false} name="Net Cost" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center italic">Red bars = Interest Bill. Green/Blue bars = Refunds & Dividends. Black Line = Actual Net Cost to you.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Cumulative Costs vs. Benefits</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => formatCurrency(val)} labelFormatter={(label) => `Date: ${label}`} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="totalInterest" stroke="#ef4444" strokeWidth={2} dot={false} name="Total Interest Paid (Cost)" />
                  <Line type="monotone" dataKey="totalRefunds" stroke="#10b981" strokeWidth={2} dot={false} name="Total Tax Refunds (Benefit)" />
                  <Line type="monotone" dataKey="totalDividends" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Dividends (Benefit)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Interest Rate History (Prime vs. BoC)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val) => `${val}%`} labelFormatter={(label) => `Date: ${label}`} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="stepAfter" dataKey="primeRate" stroke="#2563eb" strokeWidth={2} dot={false} name="Prime Rate" />
                  <Line type="stepAfter" dataKey="bocRate" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="BoC Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
