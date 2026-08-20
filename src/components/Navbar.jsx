import React from 'react';
import { LayoutDashboard, Users, FileText, Banknote, UserCheck, History } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'entry', label: 'Entry', icon: FileText },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'loan', label: 'Loan', icon: Banknote },
    { id: 'personal', label: 'Personal', icon: UserCheck },
  ];

  return (
    <nav className="bg-purple-700 text-white shadow-lg sticky top-0 z-50 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 font-bold text-xl tracking-wide min-w-max pr-4">
            <Banknote className="h-7 w-7 text-purple-200" />
            <span>FinanceManager</span>
          </div>
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === item.id ? 'bg-purple-900 text-white shadow' : 'hover:bg-purple-600 text-purple-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="md:hidden flex justify-start space-x-4 bg-purple-800 py-2 px-4 border-t border-purple-600 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center py-1 px-2 rounded-md text-xs min-w-[4rem] font-medium transition-colors ${activeTab === item.id ? 'text-white bg-purple-900' : 'text-purple-200'}`}>
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;