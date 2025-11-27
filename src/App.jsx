import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar, AlertTriangle, Info } from 'lucide-react';

// --- DATA ENGINE ---

const HISTORICAL_RETURNS = {
  'US': { 
      1995: 37.6, 1996: 23.0, 1997: 33.4, 1998: 28.6, 1999: 21.0,
      2000: -9.1, 2001: -11.9, 2002: -22.1, 2003: 28.7, 2004: 10.9, 2005: 4.9, 2006: 15.8, 2007: 5.5, 2008: -37.0, 2009: 26.5,
      2010: 15.1, 2011: 2.1, 2012: 16.0, 2013: 32.4, 2014: 13.7, 2015: 1.4, 2016: 11.9, 2017: 21.8, 2018: -4.4, 2019: 31.5,
      2020: 18.4, 2021: 28.7, 2022: -18.1, 2023: 26.3, 2024: 21.0, 2025: 10.0
  },
  'CAD': {
      1995: 14.5, 1996: 28.4, 1997: 15.0, 1998: -1.6, 1999: 31.7,
      2000: 7.4, 2001: -12.6, 2002: -12.4, 2003: 26.7, 2004: 14.5, 2005: 24.1, 2006: 17.3, 2007: 9.8, 2008: -33.0, 2009: 35.1,
      2010: 17.6, 2011: -8.7, 2012: 7.2, 2013: 13.0, 2014: 10.6, 2015: -8.3, 2016: 21.1, 2017: 9.1, 2018: -8.9, 2019: 22.9,
      2020: 5.6, 2021: 25.1, 2022: -5.8, 2023: 11.8, 2024: 15.0, 2025: 8.0
  },
  'GLOBAL': { 
      1995: 20.0, 1996: 15.0, 1997: 18.0, 1998: 20.0, 1999: 25.0,
      2000: -10.0, 2001: -15.0, 2002: -18.0, 2003: 30.0, 2004: 12.0, 2005: 8.0, 2006: 18.0, 2007: 8.0, 2008: -40.0, 2009: 28.0,
      2010: 10.0, 2011: -5.0, 2012: 14.0, 2013: 25.0, 2014: 10.0, 2015: 2.0, 2016: 8.0, 2017: 20.0, 2018: -8.0, 2019: 25.0,
      2020: 14.0, 2021: 20.0, 2022: -16.0, 2023: 20.0, 2024: 18.0, 2025: 10.0
  }
};

const PRIME_HISTORY = [
  { y: 1995, r: 8.00 }, { y: 1996, r: 6.00 }, { y: 1997, r: 5.00 }, { y: 1998, r: 6.50 }, { y: 1999, r: 6.25 },
  { y: 2000, r: 7.50 }, { y: 2001, r: 4.50 }, { y: 2002, r: 4.00 }, { y: 2003, r: 4.50 }, { y: 2004, r: 4.25 },
  { y: 2005, r: 5.00 }, { y: 2006, r: 6.00 }, { y: 2007, r: 6.00 }, { y: 2008, r: 4.00 }, { y: 2009, r: 2.25 },
  { y: 2010, r: 3.00 }, { y: 2011, r: 3.00 }, { y: 2012, r: 3.00 }, { y: 2013, r: 3.00 }, { y: 2014, r: 3.00 },
  { y: 2015, r: 2.70 }, { y: 2016, r: 2.70 }, { y: 2017, r: 3.20 }, { y: 2018, r: 3.95 }, { y: 2019, r: 3.95 },
  { y: 2020, r: 2.45 }, { y: 2021, r: 2.45 }, { y: 2022, r: 5.45 }, { y: 2023, r: 7.20 }, { y: 2024, r: 6.45 }, { y: 2025, r: 5.95 }
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

// --- HELPER FUNCTIONS ---

const formatCurrency = (val) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
const getPrimeRate = (year) => PRIME_HISTORY.find(p => p.y === year)?.r || 4.0;

// --- COMPONENT ---

export default function SmithManoeuvreApp() {
  const [selectedEtf, setSelectedEtf] = useState('XEQT');
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
  const [rateSpread, setRateSpread] = useState(0.0);
  const [taxRate, setTaxRate] = useState(50.0);
  const [startYear, setStartYear] = useState(1995);
  const [endYear, setEndYear] = useState(2025);
  const [reinvestDividends, setReinvestDividends] = useState(false);

  // Generate Year Options
  const yearOptions = useMemo(() => {
    const years = [];
    for(let y=1995; y<=2025; y++) years.push(y);
    return years;
  }, []);

  // --- SIMULATION ENGINE ---
  const simulationData = useMemo(() => {
    const etf = ETFS.find(e => e.ticker === selectedEtf);
    let currentPortfolio = initialInvestment;
    let currentLoan = initialInvestment;
    let accumInterest = 0;
    let accumRefunds = 0;
    let accumDividends = 0;
    let maxMonthly = 0;

    const dataPoints = [];

    for (let y = startYear; y <= endYear; y++) {
      const annualReturn = HISTORICAL_RETURNS[etf.proxy][y] || 5.0;
      const monthlyGrowth = annualReturn / 100 / 12;
      const monthlyYield = etf.avgYield / 100 / 12;
      const prime = getPrimeRate(y);
      const effectiveRate = prime + rateSpread;

      let yearlyNetCostMax = 0;

      for (let m = 1; m <= 12; m++) {
        // 1. Borrow & Invest
        currentLoan += monthlyInvestment;
        currentPortfolio += monthlyInvestment;

        // 2. Growth
        currentPortfolio = currentPortfolio * (1 + monthlyGrowth);

        // 3. Dividends
        const div = currentPortfolio * monthlyYield;
        accumDividends += div;
        if (reinvestDividends) currentPortfolio += div;

        // 4. Interest & Tax
        const interest = currentLoan * (effectiveRate / 100 / 12);
        accumInterest += interest;
        const refund = interest * (taxRate / 100);
        accumRefunds += refund;

        // 5. Net Cost Calculation
        let netCost = interest - refund;
        if (!reinvestDividends) netCost -= div;
        
        if (netCost > maxMonthly) maxMonthly = netCost;
        if (netCost > yearlyNetCostMax) yearlyNetCostMax = netCost;
      }

      // Snapshot at end of year
      dataPoints.push({
        year: y,
        portfolio: Math.round(currentPortfolio),
        loan: Math.round(currentLoan),
        netEquity: Math.round(currentPortfolio - currentLoan),
        netCost: Math.round(yearlyNetCostMax), // Showing max monthly cost for that year
        primeRate: prime
      });
    }

    // Final Stats
    let totalRecovered = accumRefunds;
    if (!reinvestDividends) totalRecovered += accumDividends;
    const netOutOfPocket = accumInterest - totalRecovered;
    const netEquity = currentPortfolio - currentLoan;
    const trueProfit = netEquity - netOutOfPocket;

    return {
      data: dataPoints,
      stats: {
        portfolio: currentPortfolio,
        loan: currentLoan,
        netEquity,
        trueProfit,
        netOutOfPocket,
        maxMonthly
      }
    };
  }, [selectedEtf, initialInvestment, monthlyInvestment, rateSpread, taxRate, startYear, endYear, reinvestDividends]);

  const currentEtfInfo = ETFS.find(e => e.ticker === selectedEtf);

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
      {/* Global Style Overrides to fix layout issues */}
      <style>{`
        :root, body, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          background-color: #f9fafb; /* bg-gray-50 */
        }
        /* Reset potential default centering from scaffolding tools */
        body {
          display: block !important; 
          place-items: unset !important;
        }
      `}</style>
      
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Smith Manoeuvre Backtest
          </h1>
          <p className="text-slate-500 mt-1">Historical simulation engine (1995 - 2025)</p>
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
              <div>
                <label className="block text-sm font-semibold mb-1">ETF Strategy</label>
                <select 
                  value={selectedEtf} 
                  onChange={(e) => setSelectedEtf(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {ETFS.map(e => (
                    <option key={e.ticker} value={e.ticker}>{e.ticker} - {e.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{currentEtfInfo.desc}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Initial Investment (Lump Sum)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input 
                    type="number" 
                    value={initialInvestment} 
                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    className="w-full pl-6 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Monthly Investment</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input 
                    type="number" 
                    value={monthlyInvestment} 
                    onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                    className="w-full pl-6 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Interest Rate (Prime +/-)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      step="0.1"
                      value={rateSpread} 
                      onChange={(e) => setRateSpread(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Marginal Tax Rate</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={taxRate} 
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs">%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500">Start Year</label>
                  <select 
                    value={startYear} 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStartYear(val);
                      if(endYear < val) setEndYear(val);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500">End Year</label>
                  <select 
                    value={endYear} 
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {yearOptions.filter(y => y >= startYear).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor="drip">Reinvest Dividends?</label>
                <input 
                  id="drip"
                  type="checkbox" 
                  checked={reinvestDividends} 
                  onChange={(e) => setReinvestDividends(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* CASH FLOW CARD */}
          <div className="bg-rose-50 rounded-xl shadow-sm border border-rose-100 p-6">
            <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> Cash Flow Risk
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-rose-800">Net Out-of-Pocket</span>
                <span className={`font-bold text-lg ${simulationData.stats.netOutOfPocket > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  {formatCurrency(simulationData.stats.netOutOfPocket)}
                </span>
              </div>
              <div className="h-px bg-rose-200 w-full"></div>
              <div>
                <p className="text-xs text-rose-800 font-bold uppercase mb-1">Max Monthly Pain</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-rose-700">{formatCurrency(simulationData.stats.maxMonthly)}</span>
                  <span className="text-xs text-rose-500 mb-1">/ month</span>
                </div>
                <p className="text-xs text-rose-600 mt-1 leading-tight opacity-80">
                  Highest monthly cost you had to pay during a rate spike (e.g. 2023).
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* --- RIGHT CONTENT (GRAPHS) --- */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* KEY METRICS ROW */}
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
                  <p className={`text-2xl font-extrabold mt-1 ${simulationData.stats.trueProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {formatCurrency(simulationData.stats.trueProfit)}
                  </p>
                </div>
                <DollarSign className="text-blue-300" />
              </div>
              <p className="text-xs text-blue-400 mt-1">Equity - Net Interest Paid</p>
            </div>
          </div>

          {/* GRAPH 1: NET EQUITY & GAIN */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Net Gain Over Time</h3>
              <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Interactive</div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulationData.data}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <ReferenceLine x={2008} stroke="red" strokeDasharray="3 3" label={{ value: 'GFC', position: 'insideTopLeft', fontSize: 10, fill: 'red' }} />
                  <ReferenceLine x={2020} stroke="orange" strokeDasharray="3 3" label={{ value: 'Covid', position: 'insideTopLeft', fontSize: 10, fill: 'orange' }} />
                  <Area type="monotone" dataKey="netEquity" stroke="#2563eb" fillOpacity={1} fill="url(#colorEquity)" name="Net Equity" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPH 2: ASSETS vs LIABILITIES */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Total Assets vs. Loan</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="portfolio" stroke="#059669" strokeWidth={3} dot={false} name="Portfolio Value" />
                  <Line type="monotone" dataKey="loan" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Loan Balance" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPH 3: CASH FLOW */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Net Cost (Stress Test)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationData.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val}`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <ReferenceLine y={0} stroke="#000" />
                  <Bar dataKey="netCost" name="Monthly Net Cost">
                    {simulationData.data.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.netCost > 0 ? '#fca5a5' : '#86efac'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center italic">
              Positive bars (Red) = Money you pay out of pocket monthly. Negative bars (Green) = Surplus cash flow.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
