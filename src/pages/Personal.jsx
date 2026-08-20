import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { User, Edit, Save, X, Search, CheckCircle, XCircle, Check } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => 2026 + i);

const Personal = ({ transactions = [], clients = [], setClients, initialSelectedClientId = '' }) => {
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState(initialSelectedClientId || clients[0]?.id || '');
  
  // Search & Dropdown UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Sync initial client selection
  useEffect(() => {
    if (initialSelectedClientId) {
      setSelectedClientId(initialSelectedClientId);
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [initialSelectedClientId, clients]);

  // Currently selected Client Object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Sync Search Box Text with Selected Client Name
  useEffect(() => {
    if (selectedClient) {
      setSearchTerm(`${selectedClient.name} (${selectedClient.id})`);
    }
  }, [selectedClient]);

  // Dynamic Filtered Clients for Dropdown (by Name or ID)
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        // Reset search input text back to selected client name
        if (selectedClient) {
          setSearchTerm(`${selectedClient.name} (${selectedClient.id})`);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedClient]);

  const handleSelectClient = (client) => {
    setSelectedClientId(client.id);
    setSearchTerm(`${client.name} (${client.id})`);
    setIsDropdownOpen(false);
  };

  // Individual Chart Filters
  const [chartYear, setChartYear] = useState('2026');

  // Calendar Grid Filters
  const [calendarYear, setCalendarYear] = useState(String(new Date().getFullYear()));
  const [calendarMonth, setCalendarMonth] = useState(String(new Date().getMonth()));

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', guardian: '', mobile: '', address: '', ddAmount: '' });

  // Client Specific Transactions
  const clientTransactions = useMemo(() => {
    if (!selectedClient) return [];
    return transactions.filter((txn) => txn.clientId === selectedClient.id);
  }, [transactions, selectedClient]);

  // Edit Profile Handlers
  const handleOpenEditModal = () => {
    if (!selectedClient) return;
    setProfileForm({
      name: selectedClient.name,
      guardian: selectedClient.guardian,
      mobile: selectedClient.mobile,
      address: selectedClient.address,
      ddAmount: selectedClient.ddAmount || '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!selectedClient || !setClients) return;

    setClients((prevClients) =>
      prevClients.map((c) =>
        c.id === selectedClient.id
          ? {
              ...c,
              name: profileForm.name,
              guardian: profileForm.guardian,
              mobile: profileForm.mobile,
              address: profileForm.address,
              ddAmount: profileForm.ddAmount ? Number(profileForm.ddAmount) : 0,
            }
          : c
      )
    );
    setIsEditingProfile(false);
  };

  // Chart Data for Selected Client & Selected Chart Year
  const monthlyChartData = useMemo(() => {
    const totals = Array(12).fill(0);

    clientTransactions.forEach((txn) => {
      if (!txn.date) return;
      const d = new Date(txn.date);
      if (d.getFullYear() === Number(chartYear)) {
        totals[d.getMonth()] += Number(txn.amount || 0);
      }
    });

    return MONTH_NAMES.map((name, idx) => ({
      month: name,
      fullMonth: FULL_MONTH_NAMES[idx],
      amount: totals[idx],
    }));
  }, [clientTransactions, chartYear]);

  // Days Grid Logic
  const calendarGridDays = useMemo(() => {
    const year = Number(calendarYear);
    const month = Number(calendarMonth);

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const paymentMap = {};
    clientTransactions.forEach((txn) => {
      if (!txn.date) return;
      const d = new Date(txn.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        paymentMap[day] = (paymentMap[day] || 0) + Number(txn.amount || 0);
      }
    });

    const daysArray = [];
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push({
        day,
        paid: Boolean(paymentMap[day]),
        amount: paymentMap[day] || 0,
      });
    }

    return daysArray;
  }, [clientTransactions, calendarYear, calendarMonth]);

  // Total Paid Amount for Selected Client
  const totalClientDeposit = useMemo(() => {
    return clientTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [clientTransactions]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. TOP CLIENT SELECTOR WITH AUTOCOMPLETE DROPDOWN */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6 text-purple-700" />
            <h2 className="text-xl font-bold text-gray-800">Client Personal Analytics</h2>
          </div>

          {/* Autocomplete Search Dropdown */}
          <div ref={searchContainerRef} className="relative w-full sm:w-80">
            <div className="flex items-center bg-purple-50 border border-purple-300 px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-purple-600 transition-all">
              <Search className="h-4 w-4 text-purple-700 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search by Name or ID..."
                value={searchTerm}
                onFocus={() => {
                  setSearchTerm('');
                  setIsDropdownOpen(true);
                }}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="bg-transparent text-sm font-semibold text-gray-800 outline-none w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setIsDropdownOpen(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Live Suggestion Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-purple-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-purple-50">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const isSelected = client.id === selectedClientId;
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className={`p-3 text-xs flex justify-between items-center cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-100 font-bold text-purple-900' : 'hover:bg-purple-50 text-gray-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm text-gray-800">{client.name}</p>
                          <p className="text-purple-700 font-mono">ID: {client.id} | {client.address}</p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-purple-700" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400 font-medium">
                    No client found with "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Card Info */}
        {selectedClient && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-purple-50/60 p-4 rounded-xl border border-purple-100">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full text-xs">
              <div>
                <p className="text-gray-500 font-medium">CLIENT NAME</p>
                <p className="text-sm font-bold text-purple-900">{selectedClient.name}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">CLIENT ID</p>
                <p className="text-sm font-bold text-purple-900 font-mono">{selectedClient.id}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">GUARDIAN</p>
                <p className="text-sm font-semibold text-gray-800">{selectedClient.guardian}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">MOBILE / ADDRESS</p>
                <p className="text-sm font-semibold text-gray-800">{selectedClient.mobile} ({selectedClient.address})</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">TOTAL SAVINGS</p>
                <p className="text-base font-extrabold text-green-700">₹{totalClientDeposit.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="flex items-center space-x-1 bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shadow transition-colors"
            >
              <Edit className="h-3.5 w-3.5" /> <span>Update Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CHART SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Savings Flow Chart: <span className="text-purple-700">{selectedClient?.name}</span>
            </h3>
            <p className="text-xs text-gray-500">Monthly deposit visualization for 12 months</p>
          </div>

          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-purple-200">
            <span className="text-xs font-semibold text-gray-600">Chart Year:</span>
            <select
              value={chartYear}
              onChange={(e) => setChartYear(e.target.value)}
              className="bg-white border border-purple-300 text-xs font-bold px-2.5 py-1 rounded text-purple-900 outline-none cursor-pointer"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="clientPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-purple-200 p-2.5 rounded-lg shadow-xl text-center">
                        <p className="text-xs text-gray-500 font-medium">{data.fullMonth} {chartYear}</p>
                        <p className="text-base font-extrabold text-purple-700">₹{data.amount.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6d28d9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#clientPurpleGradient)"
                dot={{ r: 4, fill: '#6d28d9', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#6d28d9', stroke: '#ffffff', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. CALENDAR GRID SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Daily Payment Status Grid</h3>
            <p className="text-xs text-gray-500">Green = Payment Received | Red = Payment Missing</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <span className="text-xs font-semibold text-gray-600">Year:</span>
              <select
                value={calendarYear}
                onChange={(e) => setCalendarYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <span className="text-xs font-semibold text-gray-600">Month:</span>
              <select
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
              >
                {FULL_MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-semibold">
          <div className="flex items-center text-emerald-700">
            <CheckCircle className="h-4 w-4 mr-1 text-emerald-600" /> Payment Received (Green)
          </div>
          <div className="flex items-center text-red-600">
            <XCircle className="h-4 w-4 mr-1 text-red-500" /> Payment Missing (Red)
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-3 pt-2">
          {calendarGridDays.map((item) => (
            <div
              key={item.day}
              className={`h-16 rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105 shadow-sm text-white font-bold p-1 ${
                item.paid ? 'bg-emerald-500 border border-emerald-600' : 'bg-red-500 border border-red-600'
              }`}
            >
              <span className="text-lg leading-tight">{item.day}</span>
              <span className="text-[10px] font-mono opacity-90 font-normal">
                {item.paid ? `₹${item.amount}` : 'No Pay'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EDIT CLIENT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-purple-900">Update Client Profile</h3>
              <button onClick={() => setIsEditingProfile(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CLIENT NAME</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GUARDIAN NAME</label>
                <input
                  type="text"
                  required
                  value={profileForm.guardian}
                  onChange={(e) => setProfileForm({ ...profileForm, guardian: e.target.value })}
                  className="w-full p-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MOBILE NUMBER</label>
                  <input
                    type="text"
                    required
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    className="w-full p-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ADDRESS</label>
                  <input
                    type="text"
                    required
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full p-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DAILY DEPOSIT TARGET (₹)</label>
                <input
                  type="number"
                  value={profileForm.ddAmount}
                  onChange={(e) => setProfileForm({ ...profileForm, ddAmount: e.target.value })}
                  className="w-full p-2 border border-purple-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-lg font-medium shadow flex items-center justify-center space-x-1"
                >
                  <Save className="h-4 w-4" /> <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Personal;