import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PlusCircle, Search, Calendar, ChevronDown, X, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

const Entry = ({ clients = [], setClients, transactions = [], setTransactions, setActiveTab }) => {
  // Today's date in YYYY-MM-DD format
  const getTodayDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Form States
  const [selectedClientId, setSelectedClientId] = useState('');
  const [entryDate, setEntryDate] = useState(getTodayDateStr());
  const [entryAmount, setEntryAmount] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Searchable Dropdown States
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Pending Modal State
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Filter clients for dropdown search
  const filteredClientsList = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [clients, clientSearchQuery]);

  // Clients who haven't made an entry today
  const pendingTodayClients = useMemo(() => {
    const todayStr = getTodayDateStr();
    
    // Get list of client IDs who paid today
    const paidClientIdsToday = new Set(
      transactions
        .filter((t) => t.date === todayStr)
        .map((t) => t.clientId)
    );

    // Return clients who are NOT in paid set
    return clients.filter((c) => !paidClientIdsToday.has(c.id));
  }, [clients, transactions]);

  // Handle Form Submit
  const handleSubmitEntry = (e) => {
    e.preventDefault();
    if (!selectedClient || !entryAmount) return;

    const amountNum = Number(entryAmount);
    const newTxnId = `TXN${Date.now().toString().slice(-6)}`;

    const newTransaction = {
      txnId: newTxnId,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      address: selectedClient.address,
      amount: amountNum,
      date: entryDate,
    };

    // Update Transactions list
    setTransactions([newTransaction, ...transactions]);

    // Update Client's entries array
    setClients((prevClients) =>
      prevClients.map((c) =>
        c.id === selectedClient.id
          ? { ...c, entries: [...(c.entries || []), amountNum] }
          : c
      )
    );

    setSuccessMsg(`Entry successful for ${selectedClient.name} (₹${amountNum})`);
    setEntryAmount('');
    
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Select client from pending modal
  const handleSelectPendingClient = (client) => {
    setSelectedClientId(client.id);
    setEntryAmount(client.ddAmount || '');
    setIsPendingModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <PlusCircle className="mr-2 text-purple-700" /> Daily Payment Entry
          </h1>
          <p className="text-sm text-gray-500">Record daily deposits for registered clients.</p>
        </div>

        {/* Pending Entry Trigger Button */}
        <button
          onClick={() => setIsPendingModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg font-semibold text-xs shadow transition-colors"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Pending Today's Entry ({pendingTodayClients.length})</span>
        </button>
      </div>

      {/* Entry Form Card */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 space-y-5">
        
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-sm font-semibold flex items-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitEntry} className="space-y-5">
          
          {/* Searchable Client Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">SELECT CLIENT</label>
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="flex items-center justify-between bg-gray-50 border border-purple-200 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-bold text-gray-800"
              >
                <div className="flex items-center truncate">
                  <Search className="h-4 w-4 text-purple-700 mr-2 shrink-0" />
                  <span className="truncate">
                    {selectedClient
                      ? `${selectedClient.name} (${selectedClient.id}) - ${selectedClient.address}`
                      : 'Search & Select Client by Name or ID...'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-purple-700 shrink-0" />
              </div>

              {isClientDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-purple-200 rounded-xl shadow-2xl z-50 p-2 space-y-2 max-h-72 flex flex-col">
                  <div className="flex items-center bg-gray-50 border border-purple-200 rounded-lg px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 text-purple-600 mr-1.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search Client Name or ID..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="bg-transparent text-xs outline-none w-full font-medium"
                    />
                    {clientSearchQuery && (
                      <button onClick={() => setClientSearchQuery('')}>
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                    {filteredClientsList.length > 0 ? (
                      filteredClientsList.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setEntryAmount(c.ddAmount || '');
                            setIsClientDropdownOpen(false);
                            setClientSearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex justify-between items-center transition-colors ${
                            c.id === selectedClientId
                              ? 'bg-purple-100 text-purple-900 font-bold'
                              : 'hover:bg-purple-50 text-gray-800'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-[10px] text-gray-500">{c.guardian} | {c.address}</p>
                          </div>
                          <span className="font-mono bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded text-[10px]">
                            {c.id}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No client found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client Quick Specs Preview */}
          {selectedClient && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Guardian:</span>
                <p className="font-semibold text-gray-800">{selectedClient.guardian}</p>
              </div>
              <div>
                <span className="text-gray-500">Address:</span>
                <p className="font-semibold text-gray-800">{selectedClient.address}</p>
              </div>
              <div>
                <span className="text-gray-500">Mobile:</span>
                <p className="font-semibold text-gray-800">{selectedClient.mobile}</p>
              </div>
              <div>
                <span className="text-gray-500">Target DD Amount:</span>
                <p className="font-bold text-purple-900">₹{selectedClient.ddAmount}</p>
              </div>
            </div>
          )}

          {/* Inputs Grid: Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Entry Date (Defaulted to Today) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ENTRY DATE</label>
              <div className="flex items-center bg-gray-50 border border-purple-200 rounded-lg px-3 py-2">
                <Calendar className="h-4 w-4 text-purple-700 mr-2" />
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-800 outline-none w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Entry Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">DEPOSIT AMOUNT (₹)</label>
              <input
                type="number"
                required
                placeholder="Enter deposit amount"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                className="w-full bg-gray-50 border border-purple-200 rounded-lg p-2 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedClient}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow text-sm transition-colors"
          >
            Submit Deposit Entry
          </button>
        </form>
      </div>

      {/* PENDING CLIENTS MODAL */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2" /> Pending Today's Payments
                </h3>
                <p className="text-xs text-gray-500">Clients who have not made an entry today ({entryDate})</p>
              </div>
              <button onClick={() => setIsPendingModalOpen(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Pending List */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 pr-1">
              {pendingTodayClients.length > 0 ? (
                pendingTodayClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectPendingClient(client)}
                    className="p-3 hover:bg-purple-50 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-purple-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.guardian} • {client.address}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-bold">
                        {client.id}
                      </span>
                      <p className="text-xs font-extrabold text-green-700 mt-0.5">₹{client.ddAmount}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <UserCheck className="h-10 w-10 text-emerald-500 mb-2" />
                  <p className="font-semibold text-emerald-800">All Clients Have Paid Today!</p>
                  <p className="text-xs text-gray-400 mt-1">There are no pending entries for today.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Entry;