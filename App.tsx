
import React, { useState, useEffect } from 'react';
import { User, Currency, ViewState } from './types';
import { getUsers, getActiveUserId, setActiveUserId, saveUser, deleteUser, initStorage } from './services/storage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Button } from './components/ui/Button';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  UserPlus,
  Trash2,
  Check,
  Menu,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [users, setUsers] = useState<User[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // New User Form State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    initStorage();
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
    const activeId = getActiveUserId();
    if (activeId) {
      const active = allUsers.find(u => u.id === activeId);
      if (active) setCurrentUser(active);
      else if (allUsers.length > 0) setCurrentUser(allUsers[0]);
    } else if (allUsers.length > 0) {
      setCurrentUser(allUsers[0]);
      setActiveUserId(allUsers[0].id);
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setActiveUserId(user.id);
  };

  const updateCurrency = (c: Currency) => {
    if (!currentUser) return;
    const updated = { ...currentUser, preferredCurrency: c };
    saveUser(updated);
    refreshUsers(); // Updates state
  };

  const handleCreateUser = () => {
    if (!newUserName || !newUserEmail) return;
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newUserName,
      email: newUserEmail,
      preferredCurrency: Currency.CHF
    };
    saveUser(newUser);
    setNewUserName('');
    setNewUserEmail('');
    setIsCreatingUser(false);
    refreshUsers();
  };
  
  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert("Impossible de supprimer le dernier utilisateur.");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses données ?")) {
      deleteUser(id);
      refreshUsers();
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // --- Views ---

  const renderSidebar = () => (
    <>
      {/* Overlay for mobile/when open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeSidebar}
        />
      )}
      
      <div className={`
        w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">F</div>
            <span className="text-xl font-bold text-white tracking-tight">FinanceFlow</span>
          </div>
          <button onClick={closeSidebar} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setCurrentView('DASHBOARD'); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
             <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</p>
             <button 
              onClick={() => { setCurrentView('USERS'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'USERS' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={20} />
              <span>Utilisateurs</span>
            </button>
             <button 
              onClick={() => { setCurrentView('CURRENCY'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'CURRENCY' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Coins size={20} />
              <span>Devise</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                {currentUser?.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                 <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
              </div>
           </div>
        </div>
      </div>
    </>
  );

  const renderUsersView = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <Button onClick={() => setIsCreatingUser(!isCreatingUser)}>
          {isCreatingUser ? 'Annuler' : 'Nouvel Utilisateur'}
        </Button>
      </div>

      {isCreatingUser && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
           <h3 className="text-lg font-semibold mb-4">Créer un profil</h3>
           <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <Button onClick={handleCreateUser} disabled={!newUserName || !newUserEmail}>
                <UserPlus size={18} className="mr-2"/> Enregistrer
              </Button>
           </div>
        </div>
      )}

      <div className="grid gap-4">
         {users.map(u => (
           <div key={u.id} className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${currentUser?.id === u.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${currentUser?.id === u.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-900">{u.name}</h3>
                       <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                   {currentUser?.id === u.id && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">Actif</span>}
                   {currentUser?.id !== u.id && (
                     <Button variant="secondary" size="sm" onClick={() => switchUser(u)}>
                       Basculer
                     </Button>
                   )}
                   <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                     <Trash2 size={18} />
                   </button>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );

  const renderCurrencyView = () => (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
       <h1 className="text-3xl font-bold text-gray-900 mb-2">Devise Préférée</h1>
       <p className="text-gray-500 mb-8">Choisissez la devise d'affichage par défaut. Les taux de conversion sont simulés pour cette démo.</p>
       
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {Object.values(Currency).map((curr) => (
           <div 
            key={curr} 
            onClick={() => updateCurrency(curr)}
            className="flex items-center justify-between p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                   {curr === 'EUR' ? '€' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : 'CHF'}
                 </div>
                 <span className="font-medium text-gray-900">{curr}</span>
              </div>
              {currentUser?.preferredCurrency === curr && (
                <Check className="text-indigo-600" size={24} />
              )}
           </div>
         ))}
       </div>
    </div>
  );

  if (!currentUser) return <div className="flex h-screen items-center justify-center text-gray-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {renderSidebar()}
      
      {/* Top Bar with Menu Toggle */}
      <div className="fixed top-0 left-0 p-4 z-30">
        <button 
          onClick={toggleSidebar}
          className="bg-white p-2 rounded-lg shadow-sm text-gray-600 hover:text-indigo-600 transition-colors border border-gray-200"
        >
          <Menu size={24} />
        </button>
      </div>
      
      <main className="p-8 pt-20 min-h-screen">
        {currentView === 'DASHBOARD' && <Dashboard user={currentUser} />}
        {currentView === 'USERS' && renderUsersView()}
        {currentView === 'CURRENCY' && renderCurrencyView()}
      </main>
    </div>
  );
};

export default App;
