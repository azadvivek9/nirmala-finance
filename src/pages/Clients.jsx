import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Eye, Printer, MapPin, CheckCircle } from 'lucide-react';
import { db } from '../firebase'; // Path fix kar diya gaya hai (../firebase)
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const PREDEFINED_ADDRESSES = ['Dumari', 'Asma', 'Bettiah', 'Motihari'];

const Clients = ({ setActiveTab, setSelectedClientId }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAddressFilter, setSelectedAddressFilter] = useState('ALL');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [successModalData, setSuccessModalData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    guardian: '',
    mobile: '',
    address: 'Dumari',
    customAddress: '',
    ddAmount: '',
  });

  // Fetch Clients from Firebase Firestore in Real-time
  useEffect(() => {
    const clientsRef = collection(db, 'clients');
    const unsubscribe = onSnapshot(clientsRef, (snapshot) => {
      const clientsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      }));
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Unique Address List
  const uniqueAddresses = useMemo(() => {
    const addressesFromClients = clients.map((c) => c.address).filter(Boolean);
    return Array.from(new Set([...PREDEFINED_ADDRESSES, ...addressesFromClients]));
  }, [clients]);

  // Generate Auto ID
  const generateClientId = (addressName) => {
    if (!addressName || addressName.trim() === '') return '';
    const prefix = addressName.trim().substring(0, 2).toUpperCase();
    const existingWithPrefix = clients.filter((c) => c.id && c.id.startsWith(prefix));
    const nextNum = existingWithPrefix.length + 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    return `${prefix}${formattedNum}`;
  };

  const handleAddressChange = (e) => {
    const selected = e.target.value;
    setFormData((prev) => {
      let updatedId = prev.id;
      if (!editClient) {
        if (selected !== 'Other') {
          updatedId = generateClientId(selected);
        } else if (prev.customAddress) {
          updatedId = generateClientId(prev.customAddress);
        }
      }
      return {
        ...prev,
        address: selected,
        id: updatedId,
      };
    });
  };

  const handleCustomAddressChange = (e) => {
    const custom = e.target.value;
    setFormData((prev) => ({
      ...prev,
      customAddress: custom,
      id: !editClient && custom ? generateClientId(custom) : prev.id,
    }));
  };

  // Filtered Clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.mobile || '').includes(searchTerm);

      const matchesAddress =
        selectedAddressFilter === 'ALL' ||
        (c.address || '').toLowerCase() === selectedAddressFilter.toLowerCase();

      return matchesSearch && matchesAddress;
    });
  }, [clients, searchTerm, selectedAddressFilter]);

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditClient(client);
      setFormData({
        id: client.id,
        name: client.name,
        guardian: client.guardian,
        mobile: client.mobile,
        address: client.address,
        customAddress: '',
        ddAmount: client.ddAmount || '',
      });
    } else {
      setEditClient(null);
      const defaultAddr = uniqueAddresses[0] || 'Dumari';
      const autoId = generateClientId(defaultAddr);
      setFormData({
        id: autoId,
        name: '',
        guardian: '',
        mobile: '',
        address: defaultAddr,
        customAddress: '',
        ddAmount: '',
      });
    }
    setShowModal(true);
  };

  // Save Client to Firebase Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    const finalAddress = formData.address === 'Other' ? formData.customAddress : formData.address;
    const finalId = formData.id || generateClientId(finalAddress || 'CL');

    const clientPayload = {
      id: finalId,
      name: formData.name,
      guardian: formData.guardian,
      mobile: formData.mobile,
      address: finalAddress,
      ddAmount: formData.ddAmount ? Number(formData.ddAmount) : 0,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'clients', finalId), clientPayload, { merge: true });
      setShowModal(false);
      setSuccessModalData(clientPayload);
    } catch (error) {
      console.error("Error saving client to Firebase:", error);
      alert("Error saving client. Please try again.");
    }
  };

  // Delete Client from Firebase Firestore
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client from Firebase?')) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (error) {
        console.error("Error deleting client:", error);
        alert("Failed to delete client.");
      }
    }
  };

  const handleViewClient = (clientId) => {
    if (setSelectedClientId && setActiveTab) {
      setSelectedClientId(clientId);
      setActiveTab('personal');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const totalDD = filteredClients.reduce((sum, c) => sum + Number(c.ddAmount || 0), 0);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Client List Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h2 { margin: 0; font-size: 22px; text-transform: uppercase; }
            .filter-info { font-size: 13px; margin-top: 8px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #fafafa; }
            @media print { @page { margin: 15mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CLIENT LIST REPORT</h2>
            <div class="filter-info">
              <span>Filter Address: ${selectedAddressFilter}</span> | 
              <span>Search: ${searchTerm || 'None'}</span> | 
              <span>Total Clients: ${filteredClients.length}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Client ID</th>
                <th>Client Name</th>
                <th>Guardian Name</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>DD Target (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClients
                .map(
                  (c, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><b>${c.id}</b></td>
                  <td>${c.name}</td>
                  <td>${c.guardian}</td>
                  <td>${c.mobile}</td>
                  <td>${c.address}</td>
                  <td>₹${c.ddAmount || 0}</td>
                </tr>
              `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">TOTAL TARGET AMOUNT:</td>
                <td>₹${totalDD}</td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-xs text-gray-500">Manage all registered daily deposit clients (Firebase Synced)</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-colors text-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print List</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-colors text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300 w-full md:max-w-md">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-gray-800"
          />
        </div>

        <div className="flex items-center space-x-2 bg-blue-50/60 px-3 py-2 rounded-lg border border-blue-200">
          <MapPin className="h-4 w-4 text-blue-700" />
          <span className="text-xs font-semibold text-blue-900 whitespace-nowrap">Filter Address:</span>
          <select
            value={selectedAddressFilter}
            onChange={(e) => setSelectedAddressFilter(e.target.value)}
            className="bg-white border border-blue-300 text-sm font-bold px-3 py-1 rounded-md text-blue-900 outline-none cursor-pointer focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">ALL</option>
            {uniqueAddresses.map((addr) => (
              <option key={addr} value={addr}>
                {addr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-blue-900 text-white border-b border-blue-950 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Client ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Guardian</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Address</th>
                <th className="p-4">DD Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-blue-600 font-semibold">
                    Loading clients from Firebase...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-800">{client.id}</td>
                    <td className="p-4 font-semibold text-gray-900">{client.name}</td>
                    <td className="p-4 text-gray-600">{client.guardian}</td>
                    <td className="p-4 text-gray-600 font-mono">{client.mobile}</td>
                    <td className="p-4 text-gray-600">{client.address}</td>
                    <td className="p-4 font-bold text-emerald-700">₹{client.ddAmount || 0}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewClient(client.id)}
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                          title="View Personal Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors border border-gray-300"
                          title="Edit Client"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                          title="Delete Client"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400 font-semibold">
                    No clients found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <h3 className="text-xl font-bold text-blue-900 border-b border-gray-200 pb-3">
              {editClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CLIENT ID (Auto-generated)</label>
                <input
                  type="text"
                  readOnly
                  value={formData.id}
                  className="w-full p-2.5 border border-blue-200 rounded-xl bg-blue-50 font-mono font-bold text-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">NAME</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">GUARDIAN</label>
                <input
                  type="text"
                  required
                  value={formData.guardian}
                  onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">MOBILE</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ADDRESS</label>
                  <select
                    value={formData.address}
                    onChange={handleAddressChange}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-gray-800"
                  >
                    {uniqueAddresses.map((addr) => (
                      <option key={addr} value={addr}>
                        {addr}
                      </option>
                    ))}
                    <option value="Other">+ Other</option>
                  </select>
                </div>
              </div>

              {formData.address === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">ENTER NEW ADDRESS</label>
                  <input
                    type="text"
                    required
                    placeholder="Type address..."
                    value={formData.customAddress}
                    onChange={handleCustomAddressChange}
                    className="w-full p-2.5 border border-blue-300 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  DAILY DEPOSIT (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={formData.ddAmount}
                  onChange={(e) => setFormData({ ...formData, ddAmount: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 border border-gray-200">
            <div className="flex justify-center">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <CheckCircle className="h-10 w-10" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Client Saved Successfully!</h3>
              <p className="text-xs text-gray-500">Client details have been registered into Firebase.</p>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">CLIENT ID:</span>
                <span className="font-bold font-mono text-blue-900">{successModalData.id}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">NAME:</span>
                <span className="font-bold text-gray-900">{successModalData.name}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">GUARDIAN:</span>
                <span className="font-semibold text-gray-700">{successModalData.guardian}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">MOBILE:</span>
                <span className="font-mono text-gray-700">{successModalData.mobile}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">ADDRESS:</span>
                <span className="font-semibold text-blue-900">{successModalData.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DAILY TARGET:</span>
                <span className="font-bold text-emerald-700">₹{successModalData.ddAmount}</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessModalData(null)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              Done / OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;
