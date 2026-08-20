import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Eye, Printer, MapPin, CheckCircle, X } from 'lucide-react';

const PREDEFINED_ADDRESSES = ['Dumari', 'Asma', 'Bettiah', 'Motihari'];

const Clients = ({ clients = [], setClients, setActiveTab, setSelectedClientId }) => {
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

  // Unique Address List for Dropdown Filter & Form Selection
  const uniqueAddresses = useMemo(() => {
    const addressesFromClients = clients.map((c) => c.address).filter(Boolean);
    return Array.from(new Set([...PREDEFINED_ADDRESSES, ...addressesFromClients]));
  }, [clients]);

  // Helper to generate Auto ID (e.g. Dumari -> DU001)
  const generateClientId = (addressName) => {
    if (!addressName) return '';
    const prefix = addressName.trim().substring(0, 2).toUpperCase();
    const existingWithPrefix = clients.filter((c) => c.id && c.id.startsWith(prefix));
    const nextNum = existingWithPrefix.length + 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    return `${prefix}${formattedNum}`;
  };

  // Update ID automatically when Address changes (Only for New Clients)
  useEffect(() => {
    if (!editClient && showModal) {
      const finalAddr = formData.address === 'Other' ? formData.customAddress : formData.address;
      if (finalAddr) {
        const autoId = generateClientId(finalAddr);
        setFormData((prev) => ({ ...prev, id: autoId }));
      }
    }
  }, [formData.address, formData.customAddress, showModal, editClient]);

  // Filtered Clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm);

      const matchesAddress =
        selectedAddressFilter === 'ALL' ||
        c.address?.toLowerCase() === selectedAddressFilter.toLowerCase();

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

  const handleSave = (e) => {
    e.preventDefault();
    const finalAddress = formData.address === 'Other' ? formData.customAddress : formData.address;
    
    const clientPayload = {
      id: formData.id,
      name: formData.name,
      guardian: formData.guardian,
      mobile: formData.mobile,
      address: finalAddress,
      ddAmount: formData.ddAmount ? Number(formData.ddAmount) : 0, // Optional
    };

    if (editClient) {
      setClients(clients.map((c) => (c.id === editClient.id ? { ...c, ...clientPayload } : c)));
    } else {
      setClients([...clients, { ...clientPayload, entries: [] }]);
    }

    setShowModal(false);
    // Show Success Popup
    setSuccessModalData(clientPayload);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter((c) => c.id !== id));
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-md border border-purple-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
          <p className="text-xs text-gray-500">Manage all registered daily deposit clients</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg font-semibold shadow transition-colors text-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print List</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-lg font-semibold shadow transition-colors text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-full md:max-w-md">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-gray-700"
          />
        </div>

        <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
          <MapPin className="h-4 w-4 text-purple-700" />
          <span className="text-xs font-semibold text-purple-900 whitespace-nowrap">Filter Address:</span>
          <select
            value={selectedAddressFilter}
            onChange={(e) => setSelectedAddressFilter(e.target.value)}
            className="bg-white border border-purple-300 text-sm font-bold px-3 py-1 rounded-md text-purple-900 outline-none cursor-pointer"
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
      <div className="bg-white rounded-xl shadow-md border border-purple-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-purple-50 text-purple-900 border-b border-purple-100 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Client ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Guardian</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Address</th>
                <th className="p-4">DD Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-purple-800">{client.id}</td>
                    <td className="p-4 font-semibold text-gray-800">{client.name}</td>
                    <td className="p-4 text-gray-600">{client.guardian}</td>
                    <td className="p-4 text-gray-600 font-mono">{client.mobile}</td>
                    <td className="p-4 text-gray-600">{client.address}</td>
                    <td className="p-4 font-bold text-green-700">₹{client.ddAmount || 0}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewClient(client.id)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="View Personal Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                          title="Edit Client"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-purple-900 border-b pb-3">
              {editClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CLIENT ID (Auto-generated)</label>
                <input
                  type="text"
                  readOnly
                  value={formData.id}
                  className="w-full p-2.5 border border-purple-200 rounded-xl bg-purple-50 font-mono font-bold text-purple-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">NAME</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">GUARDIAN</label>
                <input
                  type="text"
                  required
                  value={formData.guardian}
                  onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-600"
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
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ADDRESS</label>
                  <select
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-purple-600 font-semibold"
                  >
                    {uniqueAddresses.map((addr) => (
                      <option key={addr} value={addr}>
                        {addr}
                      </option>
                    ))}
                    {/* <option value="Other">+ Add New Address</option> */}
                  </select>
                </div>
              </div>

              {formData.address === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-purple-700 mb-1">ENTER NEW ADDRESS</label>
                  <input
                    type="text"
                    required
                    placeholder="Type address..."
                    value={formData.customAddress}
                    onChange={(e) => setFormData({ ...formData, customAddress: e.target.value })}
                    className="w-full p-2.5 border border-purple-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold text-green-700 outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-bold hover:bg-purple-800 transition-colors shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP MODAL WITH CLIENT DETAILS */}
      {successModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <CheckCircle className="h-10 w-10" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-gray-800">Client Saved Successfully!</h3>
              <p className="text-xs text-gray-500">Client details have been registered into the system.</p>
            </div>

            {/* Client Summary Box */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-purple-100 pb-1">
                <span className="text-gray-500">CLIENT ID:</span>
                <span className="font-bold font-mono text-purple-900">{successModalData.id}</span>
              </div>
              <div className="flex justify-between border-b border-purple-100 pb-1">
                <span className="text-gray-500">NAME:</span>
                <span className="font-bold text-gray-800">{successModalData.name}</span>
              </div>
              <div className="flex justify-between border-b border-purple-100 pb-1">
                <span className="text-gray-500">GUARDIAN:</span>
                <span className="font-semibold text-gray-700">{successModalData.guardian}</span>
              </div>
              <div className="flex justify-between border-b border-purple-100 pb-1">
                <span className="text-gray-500">MOBILE:</span>
                <span className="font-mono text-gray-700">{successModalData.mobile}</span>
              </div>
              <div className="flex justify-between border-b border-purple-100 pb-1">
                <span className="text-gray-500">ADDRESS:</span>
                <span className="font-semibold text-purple-800">{successModalData.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DAILY TARGET:</span>
                <span className="font-bold text-emerald-700">₹{successModalData.ddAmount}</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessModalData(null)}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md text-sm"
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