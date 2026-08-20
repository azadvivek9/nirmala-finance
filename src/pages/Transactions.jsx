import React, { useState } from 'react';
import { Printer, Search, History, Edit, Trash2, X, AlertTriangle, Filter, RotateCcw } from 'lucide-react';

const ADDRESS_OPTIONS = ['Malpur', 'Sakrauli', 'Dumari', 'Musapur', 'Bahuara'];
const MONTH_OPTIONS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => 2026 + i); // 2026 to 2036

const Transactions = ({ transactions = [], onDeleteTransaction, onEditTransaction }) => {
  // Filter States
  const [searchTxn, setSearchTxn] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');

  // Modals States
  const [deleteModalTxn, setDeleteModalTxn] = useState(null);
  const [editModalTxn, setEditModalTxn] = useState(null);
  const [editFormData, setEditFormData] = useState({ date: '', amount: '' });

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTxn('');
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedAddress('');
  };

  // Combined Multi-Filter Logic
  const filteredTransactions = transactions.filter((txn) => {
    const txnDateObj = new Date(txn.date);

    // Name or ID Search Filter
    const matchesSearch =
      (txn.clientName || '').toLowerCase().includes(searchTxn.toLowerCase()) ||
      (txn.clientId || '').toLowerCase().includes(searchTxn.toLowerCase());

    // Specific Date Filter (YYYY-MM-DD)
    const matchesDate = selectedDate === '' || txn.date === selectedDate;

    // Specific Month Filter (0 to 11)
    const matchesMonth = selectedMonth === '' || txnDateObj.getMonth() === Number(selectedMonth);

    // Specific Year Filter (2026 to 2036)
    const matchesYear = selectedYear === '' || txnDateObj.getFullYear() === Number(selectedYear);

    // Specific Address Filter
    const matchesAddress = selectedAddress === '' || txn.address === selectedAddress;

    return matchesSearch && matchesDate && matchesMonth && matchesYear && matchesAddress;
  });

  // Calculate Total Amount for filtered transactions
  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

  // Edit Handlers
  const openEditModal = (txn) => {
    setEditModalTxn(txn);
    setEditFormData({ date: txn.date, amount: txn.amount });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editModalTxn) return;

    const oldAmount = editModalTxn.amount;
    const updatedTxn = {
      ...editModalTxn,
      date: editFormData.date,
      amount: Number(editFormData.amount),
    };

    onEditTransaction(updatedTxn, oldAmount);
    setEditModalTxn(null);
  };

  // Delete Handler
  const confirmDelete = () => {
    if (deleteModalTxn) {
      onDeleteTransaction(deleteModalTxn);
      setDeleteModalTxn(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Print Specific CSS to ensure clean layout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-table-container, #printable-table-container * {
            visibility: visible;
          }
          #printable-table-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-height: none !important;
            overflow: visible !important;
          }
            
          .no-print {
            display: none !important;
          }
          table {
            border: 1px solid #000 !important;
            font-size: 11px !important;
          }
          th, td {
            padding: 4px 8px !important;
            border: 1px solid #ccc !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md border border-purple-100 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <History className="mr-2 text-purple-700" /> Transaction History
          </h1>
          <p className="text-sm text-gray-500">Filter, edit, or track client payment history.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition-colors"
        >
          <Printer className="h-4 w-4" /> <span>Print Filtered Data</span>
        </button>
      </div>

      {/* Multi-Filter Panel */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-purple-100 space-y-3 no-print">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center text-sm font-bold text-purple-900">
            <Filter className="h-4 w-4 mr-1 text-purple-700" /> Filter Transactions
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search by Name / ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">SEARCH CLIENT</label>
            <div className="flex items-center bg-gray-50 border border-purple-200 rounded-lg px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-purple-600 mr-1.5" />
              <input
                type="text"
                placeholder="Name or ID..."
                value={searchTxn}
                onChange={(e) => setSearchTxn(e.target.value)}
                className="bg-transparent text-xs outline-none w-full"
              />
            </div>
          </div>

          {/* Specific Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">SPECIFIC DATE</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-50 border border-purple-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
            />
          </div>

          {/* Specific Month Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">MONTH</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-gray-50 border border-purple-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="">All Months</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Year Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">YEAR</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-gray-50 border border-purple-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Address Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ADDRESS</label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              className="w-full bg-gray-50 border border-purple-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="">All Addresses</option>
              {ADDRESS_OPTIONS.map((addr) => (
                <option key={addr} value={addr}>
                  {addr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table & Total Bottom Row */}
      <div
        id="printable-table-container"
        className="bg-white rounded-xl shadow-md border border-purple-100 overflow-hidden flex flex-col"
      >
        {/* Scrollable Container (~10 Rows height) */}
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-purple-700 text-white text-xs uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Txn ID</th>
                <th className="p-3">Client ID & Name</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.txnId || txn.id} className="hover:bg-purple-50 transition-colors">
                    <td className="p-3 text-gray-600 font-medium whitespace-nowrap">
                      {txn.date ? new Date(txn.date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-xs whitespace-nowrap">{txn.txnId || txn.id}</td>
                    <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs mr-2 font-mono">
                        {txn.clientId}
                      </span>
                      {txn.clientName}
                    </td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{txn.address}</td>
                    <td className="p-3 font-bold text-green-700 text-right whitespace-nowrap">
                      ₹{Number(txn.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center no-print whitespace-nowrap">
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => openEditModal(txn)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModalTxn(txn)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No matching transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Total Bar */}
        <div className="bg-purple-50 border-t-2 border-purple-200 p-4 flex justify-between items-center font-bold text-purple-900 text-base">
          <span>
            Total Transactions: <span className="text-purple-700 font-extrabold">{filteredTransactions.length}</span>
          </span>
          <div className="text-right">
            <span className="text-gray-600 font-semibold mr-2 text-sm">Total Deposit:</span>
            <span className="text-green-700 text-xl font-black">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editModalTxn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-purple-900">Edit Transaction</h3>
              <button onClick={() => setEditModalTxn(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg text-xs space-y-1 text-purple-900">
              <p>
                <strong>Client:</strong> {editModalTxn.clientName} ({editModalTxn.clientId})
              </p>
              <p>
                <strong>Txn ID:</strong> {editModalTxn.txnId || editModalTxn.id}
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ENTRY DATE</label>
                <input
                  type="date"
                  required
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">AMOUNT (₹)</label>
                <input
                  type="number"
                  required
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-lg font-medium shadow"
              >
                Update Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTxn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">Confirm Delete?</h3>

            <p className="text-sm text-gray-600">
              Kya aap <strong className="text-gray-900">{deleteModalTxn.clientName}</strong> ki ₹
              {deleteModalTxn.amount} ki transaction delete karna chahte hain?
            </p>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteModalTxn(null)}
                className="w-1/2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-1/2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;