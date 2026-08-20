import React, { useState, useMemo } from 'react';
import { Users, IndianRupee, TrendingUp, PiggyBank, Printer, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['#7c3aed', '#9333ea', '#c084fc', '#a855f7', '#6b21a8', '#3b82f6', '#10b981', '#f59e0b'];

const Dashboard = ({ clients = [], transactions = [] }) => {
  const getCurrentMonthStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());

  // 1. DYNAMIC STATS CALCULATION
  const stats = useMemo(() => {
    const today = new Date();
    const todayDateStr = today.toDateString();
    const [selectedYearStr, selectedMonthStr] = selectedMonth.split('-');

    let todayCollection = 0;
    let monthlyCollection = 0;
    let totalDeposit = 0;

    transactions.forEach((txn) => {
      if (!txn.amount) return;
      const amount = Number(txn.amount);
      totalDeposit += amount; // Overall total deposit across all time

      if (!txn.date) return;
      const txnDate = new Date(txn.date);

      // Today's Collection Check
      if (txnDate.toDateString() === todayDateStr) {
        todayCollection += amount;
      }

      // Selected Month's Collection Check
      if (
        txnDate.getFullYear() === Number(selectedYearStr) &&
        txnDate.getMonth() + 1 === Number(selectedMonthStr)
      ) {
        monthlyCollection += amount;
      }
    });

    return {
      totalClients: clients.length,
      todayCollection,
      monthlyCollection,
      totalDeposit,
    };
  }, [clients, transactions, selectedMonth]);

  // 2. LIVE ADDRESS-WISE COLLECTION
  const addressData = useMemo(() => {
    const addressMap = {};
    const clientAddressMap = {};

    clients.forEach((c) => {
      clientAddressMap[c.id] = c.address || 'Unknown';
    });

    transactions.forEach((txn) => {
      if (!txn.amount) return;
      const clientAddr = clientAddressMap[txn.clientId] || 'Other';
      addressMap[clientAddr] = (addressMap[clientAddr] || 0) + Number(txn.amount);
    });

    const result = Object.keys(addressMap).map((addr) => ({
      name: addr,
      value: addressMap[addr],
    }));

    return result.length > 0 ? result : [{ name: 'No Data', value: 0 }];
  }, [clients, transactions]);

  // 3. SMOOTH GRADIENT AREA CHART DATA
  const monthlyTrendData = useMemo(() => {
    const [selectedYearStr] = selectedMonth.split('-');
    const yearNumber = Number(selectedYearStr);
    const totals = Array(12).fill(0);

    transactions.forEach((txn) => {
      if (!txn.date || !txn.amount) return;
      const d = new Date(txn.date);
      if (d.getFullYear() === yearNumber) {
        totals[d.getMonth()] += Number(txn.amount);
      }
    });

    return MONTH_NAMES.map((m, idx) => ({
      month: m,
      fullMonth: FULL_MONTH_NAMES[idx],
      amount: totals[idx],
    }));
  }, [transactions, selectedMonth]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md border border-purple-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
          <p className="text-sm text-gray-500">Live Analytics & Performance Overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
            <Calendar className="h-4 w-4 text-purple-700" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm text-purple-900 font-semibold outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Clients */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Clients</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{stats.totalClients}</h3>
          </div>
        </div>

        {/* Today Collection */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Today Collection</p>
            <h3 className="text-2xl font-extrabold text-gray-800">₹{stats.todayCollection.toLocaleString()}</h3>
          </div>
        </div>

        {/* Monthly Collection */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Monthly Collection</p>
            <h3 className="text-2xl font-extrabold text-gray-800">₹{stats.monthlyCollection.toLocaleString()}</h3>
          </div>
        </div>

        {/* Total Deposit (Ab tak ka kul jama) */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Deposit</p>
            <h3 className="text-2xl font-extrabold text-gray-800">₹{stats.totalDeposit.toLocaleString()}</h3>
          </div>
        </div>

      </div>

      {/* Live Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Address Wise Collection Pie Chart */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Address-Wise Collection</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={addressData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {addressData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Custom Purple Area Chart */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            Monthly Collection Trend ({selectedMonth.split('-')[0]})
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradientFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-purple-100 p-3 rounded-xl shadow-2xl text-center min-w-[100px]">
                          <p className="text-base font-extrabold text-gray-900">₹{data.amount.toLocaleString()}</p>
                          <p className="text-xs font-semibold text-purple-600 flex items-center justify-center gap-1 mt-0.5">
                            <span className="h-2 w-2 rounded-full bg-purple-600 inline-block"></span>
                            {data.fullMonth}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#purpleGradientFill)"
                  dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;