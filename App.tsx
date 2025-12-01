import React, { useState, useEffect } from 'react';
import { AppState, User, YearData, MONTH_NAMES } from './types';
import { loadData, saveData, saveUsers, createDefaultYear, generateId } from './utils';
import { Dashboard } from './components/Dashboard';
import { MonthInput } from './components/MonthInput';
import { Investments, Fortune } from './components/Wealth';
import { Settings } from './components/Settings';
import { LayoutDashboard, Wallet, TrendingDown, PiggyBank, Briefcase, Users, LogOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';

// Initial State helper
const getInitialState = (): AppState => {
  const { users, data } = loadData();
  const currentYear = new Date().getFullYear();
  
  // Default user if none exists
  let finalUsers = users;
  if (users.length === 0) {
    const defaultUser: User = { id: generateId(), name: "Utilisateur Principal", type: 'individuel', currency: 'CHF' };
    finalUsers = [defaultUser];
    saveUsers(finalUsers);
  }

  return {
    users: finalUsers,
    activeUserId: finalUsers[0].id,
    activeYear: currentYear,
    data: data
  };
};

function App() {
  const [state, setState] = useState<AppState>(getInitialState);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entrees' | 'depenses' | 'investissements' | 'fortune' | 'users'>('dashboard');

  // Helpers to get current context
  const currentUser = state.users.find(u => u.id === state.activeUserId) || state.users[0];
  
  // Ensure year data exists for current user/year
  useEffect(() => {
    if (!state.data[currentUser.id] || !state.data[currentUser.id][state.activeYear]) {
      const newYearData = createDefaultYear(state.activeYear);
      setState(prev => {
        const newData = { ...prev.data };
        if (!newData[currentUser.id]) newData[currentUser.id] = {};
        newData[currentUser.id][state.activeYear] = newYearData;
        
        // Persist immediately
        saveData(currentUser.id, newYearData);
        return { ...prev, data: newData };
      });
    }
  }, [currentUser.id, state.activeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentYearData = state.data[currentUser.id]?.[state.activeYear];

  // Global Updater
  const updateYearData = (newData: YearData) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [currentUser.id]: {
          ...prev.data[currentUser.id],
          [state.activeYear]: newData
        }
      }
    }));
    saveData(currentUser.id, newData);
  };

  const addUser = (newUser: User) => {
    const updatedUsers = [...state.users, newUser];
    setState(prev => ({ ...prev, users: updatedUsers }));
    saveUsers(updatedUsers);
  };

  const importData = (json: any) => {
    // Basic Import Logic: Merge/Overwrite user data from JSON
    const importedUser = json.user as User;
    const importedData = json.data as Record<number, YearData>;

    // 1. Add/Update User
    let newUsers = [...state.users];
    const existingUserIndex = newUsers.findIndex(u => u.id === importedUser.id);
    if (existingUserIndex >= 0) {
      newUsers[existingUserIndex] = importedUser;
    } else {
      newUsers.push(importedUser);
    }
    saveUsers(newUsers);

    // 2. Update Data State & LocalStorage
    const newDataState = { ...state.data };
    newDataState[importedUser.id] = importedData;
    
    // Save all imported years to LS
    Object.values(importedData).forEach(yd => saveData(importedUser.id, yd));

    setState(prev => ({
      ...prev,
      users: newUsers,
      data: newDataState,
      activeUserId: importedUser.id // Switch to imported user to see results
    }));
  };

  // --- Render ---

  if (!currentYearData) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-500">Chargement...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-10 transition-all hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">FinanceFlow</h1>
          <p className="text-xs text-slate-400 mt-1">Gestion Personnelle</p>
        </div>

        {/* User Switcher */}
        <div className="px-4 py-4 border-b border-slate-800">
          <label className="text-xs text-slate-500 font-semibold uppercase mb-2 block">Profil Actif</label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            value={currentUser.id}
            onChange={(e) => setState(prev => ({ ...prev, activeUserId: e.target.value }))}
          >
            {state.users.map(u => (
              <option key={u.id} value={u.id}>{u.name} {u.type === 'commun' ? '(Commun)' : ''}</option>
            ))}
          </select>
        </div>

        {/* Year Switcher */}
        <div className="px-4 py-4 border-b border-slate-800">
           <label className="text-xs text-slate-500 font-semibold uppercase mb-2 block">Année</label>
           <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
             <button onClick={() => setState(p => ({...p, activeYear: p.activeYear - 1}))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
             <span className="flex-1 text-center font-medium">{state.activeYear}</span>
             <button onClick={() => setState(p => ({...p, activeYear: p.activeYear + 1}))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><ChevronRight size={16}/></button>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Vue d'ensemble" />
          <NavButton active={activeTab === 'entrees'} onClick={() => setActiveTab('entrees')} icon={<Wallet size={20} />} label="Entrées" />
          <NavButton active={activeTab === 'depenses'} onClick={() => setActiveTab('depenses')} icon={<TrendingDown size={20} />} label="Dépenses" />
          <NavButton active={activeTab === 'investissements'} onClick={() => setActiveTab('investissements')} icon={<Briefcase size={20} />} label="Investissements" />
          <NavButton active={activeTab === 'fortune'} onClick={() => setActiveTab('fortune')} icon={<PiggyBank size={20} />} label="Fortune" />
          <div className="pt-6 mt-6 border-t border-slate-800">
             <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20} />} label="Paramètres & Données" />
          </div>
        </nav>
        
        <div className="p-4 text-xs text-slate-600 text-center">
          FinanceFlow v1.0 &copy; 2025
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-20 flex flex-col shadow-md">
        {/* Top Row: Logo & Tab Switcher */}
        <div className="flex justify-between items-center p-4 pb-2">
           <span className="font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">FinanceFlow</span>
           <select 
              className="bg-slate-800 border border-slate-700 rounded text-sm px-2 py-1 max-w-[150px] outline-none"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="entrees">Entrées</option>
              <option value="depenses">Dépenses</option>
              <option value="investissements">Investissements</option>
              <option value="fortune">Fortune</option>
              <option value="users">Paramètres</option>
            </select>
        </div>

        {/* Bottom Row: Year & User Switcher */}
        <div className="flex justify-between items-center px-4 pb-4 pt-2 gap-4">
            {/* Year Control */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
               <button 
                 onClick={() => setState(p => ({...p, activeYear: p.activeYear - 1}))} 
                 className="p-2 hover:bg-slate-700 rounded-l-lg text-slate-400 hover:text-white transition-colors"
               >
                 <ChevronLeft size={16}/>
               </button>
               <span className="font-medium text-sm px-3">{state.activeYear}</span>
               <button 
                 onClick={() => setState(p => ({...p, activeYear: p.activeYear + 1}))} 
                 className="p-2 hover:bg-slate-700 rounded-r-lg text-slate-400 hover:text-white transition-colors"
               >
                 <ChevronRight size={16}/>
               </button>
            </div>

            {/* User Select */}
            <select 
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
              value={currentUser.id}
              onChange={(e) => setState(prev => ({ ...prev, activeUserId: e.target.value }))}
            >
              {state.users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-36 md:pt-8 overflow-y-auto h-screen">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{TAB_TITLES[activeTab]}</h2>
            <p className="text-slate-500 mt-1">
              Profil: <span className="font-semibold text-slate-700">{currentUser.name}</span> • Année: <span className="font-semibold text-slate-700">{state.activeYear}</span>
            </p>
          </div>
          <div className="hidden md:block">
             <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium border border-blue-200">
                {currentUser.currency}
             </span>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard data={currentYearData} user={currentUser} />}
        {activeTab === 'entrees' && <MonthInput type="entrees" yearData={currentYearData} user={currentUser} onUpdate={updateYearData} />}
        {activeTab === 'depenses' && <MonthInput type="depenses" yearData={currentYearData} user={currentUser} onUpdate={updateYearData} />}
        {activeTab === 'investissements' && <Investments yearData={currentYearData} user={currentUser} onUpdate={updateYearData} />}
        {activeTab === 'fortune' && <Fortune yearData={currentYearData} user={currentUser} onUpdate={updateYearData} />}
        {activeTab === 'users' && <Settings appState={state} addUser={addUser} importData={importData} currentUser={currentUser} />}
      </main>
    </div>
  );
}

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const TAB_TITLES: Record<string, string> = {
  dashboard: "Vue d'ensemble",
  entrees: "Gestion des Entrées",
  depenses: "Gestion des Dépenses",
  investissements: "Portefeuille d'Investissement",
  fortune: "Fortune & Patrimoine",
  users: "Paramètres & Données"
};

export default App;