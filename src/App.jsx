import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Entry from './pages/Entry';
import Loan from './pages/Loan';
import Personal from './pages/Personal';
import Transactions from './pages/Transactions';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState('');

  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Listeners for Firestore
  useEffect(() => {
    // 1. Fetch & Sync Clients
    const unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const clientData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientData);
    });

    // 2. Fetch & Sync Transactions
    const unsubscribeTxns = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const txnData = snapshot.docs.map((doc) => ({
        txnId: doc.id,
        ...doc.data(),
      }));
      setTransactions(txnData);
    });

    // 3. Fetch & Sync Loans
    const unsubscribeLoans = onSnapshot(collection(db, 'loans'), (snapshot) => {
      const loanData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLoans(loanData);
      setLoading(false);
    });

    return () => {
      unsubscribeClients();
      unsubscribeTxns();
      unsubscribeLoans();
    };
  }, []);

  // Delete Transaction from Firebase
  const handleDeleteTransaction = async (txnToDelete) => {
    try {
      // Delete transaction document
      await deleteDoc(doc(db, 'transactions', txnToDelete.txnId));

      // Update client's entries array in Firebase
      const targetClient = clients.find((c) => c.id === txnToDelete.clientId);
      if (targetClient && targetClient.entries) {
        const updatedEntries = [...targetClient.entries];
        const index = updatedEntries.indexOf(txnToDelete.amount);
        if (index > -1) {
          updatedEntries.splice(index, 1);
          await updateDoc(doc(db, 'clients', targetClient.id), {
            entries: updatedEntries,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting transaction: ", error);
    }
  };

  // Edit Transaction in Firebase
  const handleEditTransaction = async (updatedTxn, oldAmount) => {
    try {
      // Update transaction doc
      await updateDoc(doc(db, 'transactions', updatedTxn.txnId), updatedTxn);

      // Update client's entries array in Firebase
      const targetClient = clients.find((c) => c.id === updatedTxn.clientId);
      if (targetClient && targetClient.entries) {
        const updatedEntries = [...targetClient.entries];
        const index = updatedEntries.indexOf(oldAmount);
        if (index > -1) {
          updatedEntries[index] = updatedTxn.amount;
        } else {
          updatedEntries.push(updatedTxn.amount);
        }
        await updateDoc(doc(db, 'clients', targetClient.id), {
          entries: updatedEntries,
        });
      }
    } catch (error) {
      console.error("Error updating transaction: ", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-purple-700 font-bold">
        Loading Realtime Database...
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard clients={clients} transactions={transactions} loans={loans} />;
      case 'clients':
        return (
          <Clients
            clients={clients}
            setClients={setClients}
            setActiveTab={setActiveTab}
            setSelectedClientId={setSelectedClientId}
          />
        );
      case 'entry':
        return (
          <Entry
            clients={clients}
            setClients={setClients}
            transactions={transactions}
            setTransactions={setTransactions}
            setActiveTab={setActiveTab}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
          />
        );
      case 'loan':
        return <Loan loans={loans} setLoans={setLoans} />;
      case 'personal':
        return (
          <Personal
            transactions={transactions}
            clients={clients}
            setClients={setClients}
            initialSelectedClientId={selectedClientId}
          />
        );
      default:
        return <Dashboard clients={clients} transactions={transactions} loans={loans} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-12">{renderPage()}</main>
    </div>
  );
}

export default App;