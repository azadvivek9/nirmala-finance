import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PlusCircle, Search, Calendar, ChevronDown, X, AlertCircle, CheckCircle2, UserCheck, Loader2 } from 'lucide-react';
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const Entry = ({ clients = [], setClients, transactions = [], setTransactions, setActiveTab }) => {
  // Today's date in local YYYY-MM-DD format
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
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
    return clients.find((c) => String(c.id) === String(selectedClientId)) || null;
  }, [clients, selectedClientId]);

  // Filter clients for dropdown search
  const filteredClientsList = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.id && String(c.id).toLowerCase().includes(q))
    );
  }, [clients, clientSearchQuery]);

  // FIX: Clients who haven't made an entry for the selected date (entryDate)
  const pendingTodayClients = useMemo(() => {
    const paidClientIdsToday = new Set();

    transactions.forEach((t) => {
      // Date comparison handle formatting (YYYY-MM-DD)
      let txnDate = t.date;
      if (txnDate && txnDate.includes('T')) {
        txnDate = txnDate.split('T')[0];
      }

      if (txnDate === entryDate && t.clientId) {
        paidClientIdsToday.add(String(t.clientId));
      }
    });

    // Return clients who are NOT in paid set
    return clients.filter((c) => !paidClientIdsToday.has(String(c.id)));
  }, [clients, transactions, entryDate]);

  // Handle Form Submit with Firebase Firestore
  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    if (!selectedClient || !entryAmount) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const amountNum = Number(entryAmount);
    const newTxnId = `TXN${Date.now().toString().slice(-6)}`;

    const newTransaction = {
      txnId: newTxnId,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      address: selectedClient.address,
      amount: amountNum,
      date: entryDate,
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Firebase Firestore "transactions" collection mein add karein
      const docRef = await addDoc(collection(db, "transactions"), newTransaction);

      // 2. Client document agar Firestore mein update karna ho
      if (selectedClient.docId) {
        const clientRef = doc(db, "clients", selectedClient.docId);
        await updateDoc(clientRef, {
          entries: arrayUnion(amountNum)
        });
      }

      // 3. Local React State Update Karein
      setTransactions([ { ...newTransaction, firebaseDocId: docRef.id }, ...transactions ]);

      setClients((prevClients) =>
        prevClients.map((c) =>
          String(c.id) === String(selectedClient.id)
            ? { ...c, entries: [...(c.entries || []), amountNum] }
            : c
        )
      );

      setSuccessMsg(`Entry successful for ${selectedClient.name} (₹${amountNum})`);
      setEntryAmount('');
      setSelectedClientId('');

      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);

    } catch (error) {
      console.error("Firebase Error: ", error);
      setErrorMsg("Failed to save entry in Firebase: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Select client from pending modal
  const handleSelectPendingClient = (client) => {
    setSelectedClientId(client.id);
    setEntryAmount(client.ddAmount || '');
    setIsPendingModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <PlusCircle className="mr-2 text-blue-700" /> Daily Payment Entry
          </h1>
          <p className="text-xs text-gray-500">Record daily deposits for registered clients.</p>
        </div>

        {/* Pending Entry Trigger Button */}
        <button
          onClick={() => setIsPendingModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg font-semibold text-xs shadow-sm transition-colors"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Pending Today's Entry ({pendingTodayClients.length})</span>
        </button>
      </div>

      {/* Entry Form Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
        
        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-sm font-semibold flex items-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-semibold flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitEntry} className="space-y-5">
          
          {/* Searchable Client Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">SELECT CLIENT</label>
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="flex items-center justify-between bg-gray-50 border border-gray-300 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-bold text-gray-800"
              >
                <div className="flex items-center truncate">
                  <Search className="h-4 w-4 text-blue-700 mr-2 shrink-0" />
                  <span className="truncate">
                    {selectedClient
                      ? `${selectedClient.name} (${selectedClient.id}) - ${selectedClient.address}`
                      : 'Search & Select Client by Name or ID...'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-blue-700 shrink-0" />
              </div>

              {isClientDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 space-y-2 max-h-72 flex flex-col">
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 text-blue-700 mr-1.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search Client Name or ID..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="bg-transparent text-xs outline-none w-full font-medium text-gray-800"
                    />
                    {clientSearchQuery && (
                      <button type="button" onClick={() => setClientSearchQuery('')}>
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
                            String(c.id) === String(selectedClientId)
                              ? 'bg-blue-50 text-blue-900 font-bold'
                              : 'hover:bg-blue-50/50 text-gray-800'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-[10px] text-gray-500">{c.guardian} | {c.address}</p>
                          </div>
                          <span className="font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {c.id}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-400 font-semibold">No client found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client Quick Specs Preview */}
          {selectedClient && (
            <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                <p className="font-bold text-blue-900">₹{selectedClient.ddAmount}</p>
              </div>
            </div>
          )}

          {/* Inputs Grid: Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Entry Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ENTRY DATE</label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                <Calendar className="h-4 w-4 text-blue-700 mr-2" />
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">DEPOSIT AMOUNT (₹)</label>
              <input
                type="number"
                required
                placeholder="Enter deposit amount"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedClient || loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-sm text-sm transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <span>Submit Deposit Entry</span>
            )}
          </button>
        </form>
      </div>

      {/* PENDING CLIENTS MODAL */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col border border-gray-200">
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
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
                    className="p-3 hover:bg-blue-50/60 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-blue-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.guardian} • {client.address}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono bg-blue-100 text-blue-900 text-xs px-2 py-0.5 rounded font-bold">
                        {client.id}
                      </span>
                      <p className="text-xs font-extrabold text-emerald-700 mt-0.5">₹{client.ddAmount}</p>
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
