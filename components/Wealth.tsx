
import React, { useState } from 'react';
import { YearData, User, Investment, BankAccount, MONTH_NAMES, Asset } from '../types';
import { formatMoney, generateId } from '../utils';
import { Plus, Trash2, TrendingUp, Building, DollarSign, Pencil, Save, X, Briefcase } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface WealthProps {
  yearData: YearData;
  user: User;
  onUpdate: (updatedYearData: YearData) => void;
}

const COLORS = ['#2563eb', '#16a34a', '#db2777', '#ca8a04', '#9333ea', '#0891b2', '#ea580c', '#4b5563'];

export const Investments: React.FC<WealthProps> = ({ yearData, user, onUpdate }) => {
  const [newInv, setNewInv] = useState<Partial<Investment>>({ type: 'Actions / ETF' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Investment | null>(null);

  const addInvestment = () => {
    if (!newInv.name || !newInv.investedAmount || newInv.currentValue === undefined) return;

    // Initialize history with current value for current month (approx) or empty
    const history: Record<string, number> = {};
    const currentMonthKey = String(new Date().getMonth() + 1).padStart(2, '0');
    history[currentMonthKey] = Number(newInv.currentValue);

    const investment: Investment = {
      id: generateId(),
      name: newInv.name,
      type: newInv.type as any,
      investedAmount: Number(newInv.investedAmount),
      currentValue: Number(newInv.currentValue),
      history: history,
      note: newInv.note || ''
    };

    const newData = JSON.parse(JSON.stringify(yearData));
    newData.investments.push(investment);
    onUpdate(newData);
    setNewInv({ type: 'Actions / ETF', name: '', investedAmount: 0, currentValue: 0, note: '' });
  };

  const removeInvestment = (id: string) => {
    if(!window.confirm("Supprimer cet investissement ?")) return;
    const newData = JSON.parse(JSON.stringify(yearData));
    newData.investments = newData.investments.filter((i: Investment) => i.id !== id);
    onUpdate(newData);
  };

  const startEditing = (inv: Investment) => {
    // Ensure history exists
    const history = inv.history || {};
    setEditForm({ ...inv, history: { ...history } });
    setEditingId(inv.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEditing = () => {
    if (!editForm) return;
    const newData = JSON.parse(JSON.stringify(yearData));
    const index = newData.investments.findIndex((i: Investment) => i.id === editingId);
    if (index !== -1) {
      // Logic: Update currentValue to the latest month's value if available
      const history = editForm.history || {};
      const months = Object.keys(MONTH_NAMES).sort().reverse();
      let latestVal = editForm.currentValue; // Default to manual input if no history
      
      for (const m of months) {
        if (history[m] !== undefined && history[m] !== 0) {
          latestVal = history[m];
          break;
        }
      }
      
      newData.investments[index] = { ...editForm, currentValue: latestVal };
      onUpdate(newData);
    }
    setEditingId(null);
    setEditForm(null);
  };

  const handleHistoryChange = (monthKey: string, val: string) => {
    if (!editForm) return;
    const numVal = parseFloat(val) || 0;
    setEditForm({
      ...editForm,
      history: {
        ...editForm.history,
        [monthKey]: numVal
      }
    });
  };

  // Prepare Chart Data
  const chartData = Object.keys(MONTH_NAMES).sort().map(monthKey => {
    const point: any = { name: MONTH_NAMES[monthKey].substring(0, 3) };
    yearData.investments.forEach(inv => {
      // Use history if available, otherwise fallback to 0 (or currentValue if we wanted flat lines, but 0 shows missing data better)
      const val = inv.history && inv.history[monthKey] !== undefined ? inv.history[monthKey] : 0;
      point[inv.name] = val;
    });
    return point;
  });

  const totalInvested = yearData.investments.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalValue = yearData.investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalPL = totalValue - totalInvested;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm uppercase tracking-wide">Total Investi</p>
          <p className="text-2xl font-bold text-slate-800">{formatMoney(totalInvested, user.currency)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm uppercase tracking-wide">Valeur Actuelle</p>
          <p className="text-2xl font-bold text-blue-600">{formatMoney(totalValue, user.currency)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm uppercase tracking-wide">Plus/Moins-value</p>
          <p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalPL >= 0 ? '+' : ''}{formatMoney(totalPL, user.currency)}
          </p>
        </div>
      </div>

      {/* Main List Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><TrendingUp size={20}/> Portefeuille</h3>
        </div>
        
        {/* Add Form */}
        {!editingId && (
          <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-500">Type</label>
              <select 
                value={newInv.type} 
                onChange={e => setNewInv({...newInv, type: e.target.value as any})}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Actions / ETF</option>
                <option>Crypto</option>
                <option>Immobilier</option>
                <option>Autres</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-semibold text-slate-500">Nom</label>
              <input type="text" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex. S&P 500" value={newInv.name || ''} onChange={e => setNewInv({...newInv, name: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-500">Investi</label>
              <input type="number" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" value={newInv.investedAmount || ''} onChange={e => setNewInv({...newInv, investedAmount: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-500">Valeur Initiale</label>
              <input type="number" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" value={newInv.currentValue || ''} onChange={e => setNewInv({...newInv, currentValue: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <button onClick={addInvestment} className="w-full bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 h-[38px] flex items-center justify-center gap-2 transition-colors">
                <Plus size={18} /> <span className="md:hidden">Ajouter</span>
              </button>
            </div>
          </div>
        )}

        {/* Investment List & Editor */}
        <div className="divide-y divide-slate-100">
          {yearData.investments.map(inv => {
            const isEditing = editingId === inv.id;
            const pl = inv.currentValue - inv.investedAmount;
            
            if (isEditing && editForm) {
              return (
                <div key={inv.id} className="bg-blue-50 p-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2"><Pencil size={16}/> Édition: {inv.name}</h4>
                    <div className="flex gap-2">
                      <button onClick={cancelEditing} className="px-3 py-1 bg-white text-slate-600 rounded border border-slate-200 hover:bg-slate-50 text-sm">Annuler</button>
                      <button onClick={saveEditing} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"><Save size={14}/> Enregistrer</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                       <label className="block text-xs font-semibold text-blue-800 mb-1">Nom</label>
                       <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-blue-800 mb-1">Montant Investi</label>
                       <input type="number" value={editForm.investedAmount} onChange={e => setEditForm({...editForm, investedAmount: Number(e.target.value)})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-blue-800 mb-1">Type</label>
                       <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})} className="w-full p-2 border rounded text-sm">
                          <option>Actions / ETF</option>
                          <option>Crypto</option>
                          <option>Immobilier</option>
                          <option>Autres</option>
                       </select>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                        <h5 className="font-semibold text-sm text-slate-700">Historique de valeur (pour le graphique)</h5>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Remplissez les mois connus</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.keys(MONTH_NAMES).sort().map(key => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">{MONTH_NAMES[key]}</label>
                          <input 
                            type="number" 
                            placeholder="0.00"
                            className="w-full p-2 border border-slate-200 rounded text-sm text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editForm.history?.[key] === 0 ? '' : editForm.history?.[key]}
                            onChange={e => handleHistoryChange(key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2 italic">* La "Valeur Actuelle" globale sera mise à jour automatiquement avec la valeur du mois le plus récent saisi.</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                  <div className={`p-3 rounded-full ${
                    inv.type === 'Crypto' ? 'bg-purple-100 text-purple-600' :
                    inv.type === 'Immobilier' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {inv.type === 'Crypto' ? <DollarSign size={20}/> : <TrendingUp size={20}/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{inv.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">{inv.type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full md:w-auto text-right">
                  <div>
                    <p className="text-xs text-slate-400">Investi</p>
                    <p className="font-medium text-slate-700">{formatMoney(inv.investedAmount, user.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Valeur</p>
                    <p className="font-bold text-blue-600">{formatMoney(inv.currentValue, user.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">P/L</p>
                    <p className={`font-medium ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {pl >= 0 ? '+' : ''}{formatMoney(pl, user.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0 border-slate-100">
                  <button onClick={() => startEditing(inv)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Éditer la valeur">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => removeInvestment(inv.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {yearData.investments.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic">
              Aucun investissement pour le moment. Ajoutez-en un ci-dessus.
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      {yearData.investments.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Évolution des actifs (Année {yearData.year})</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {yearData.investments.map((inv, index) => (
                  <Line 
                    key={inv.id}
                    type="monotone" 
                    dataKey={inv.name} 
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            * Le graphique affiche les valeurs renseignées dans l'historique d'édition de chaque actif. Si une valeur est à 0, cela signifie qu'elle n'a pas été renseignée pour ce mois.
          </p>
        </div>
      )}
    </div>
  );
};

export const Fortune: React.FC<WealthProps> = ({ yearData, user, onUpdate }) => {
  const [newBank, setNewBank] = useState({ name: '', balance: 0 });
  const [newAsset, setNewAsset] = useState({ name: '', value: 0 });

  // State for editing logic
  const [editingItem, setEditingItem] = useState<{ type: 'bank' | 'asset', id: string, form: any } | null>(null);

  const addBankAccount = () => {
    if(!newBank.name) return;
    const newData = JSON.parse(JSON.stringify(yearData));
    
    // Auto-init history for current month
    const history: Record<string, number> = {};
    const currentMonthKey = String(new Date().getMonth() + 1).padStart(2, '0');
    history[currentMonthKey] = Number(newBank.balance);

    newData.fortune.bankAccounts.push({ 
        id: generateId(), 
        name: newBank.name, 
        balance: Number(newBank.balance),
        history: history 
    });
    onUpdate(newData);
    setNewBank({ name: '', balance: 0 });
  };

  const removeBankAccount = (id: string) => {
    const newData = JSON.parse(JSON.stringify(yearData));
    newData.fortune.bankAccounts = newData.fortune.bankAccounts.filter((b: BankAccount) => b.id !== id);
    onUpdate(newData);
  };

  const addAsset = () => {
    if(!newAsset.name) return;
    const newData = JSON.parse(JSON.stringify(yearData));
    if (!newData.fortune.otherAssets) newData.fortune.otherAssets = [];
    
    const history: Record<string, number> = {};
    const currentMonthKey = String(new Date().getMonth() + 1).padStart(2, '0');
    history[currentMonthKey] = Number(newAsset.value);

    newData.fortune.otherAssets.push({ 
        id: generateId(), 
        name: newAsset.name, 
        value: Number(newAsset.value),
        history: history 
    });
    onUpdate(newData);
    setNewAsset({ name: '', value: 0 });
  };

  const removeAsset = (id: string) => {
    const newData = JSON.parse(JSON.stringify(yearData));
    if (newData.fortune.otherAssets) {
        newData.fortune.otherAssets = newData.fortune.otherAssets.filter((a: Asset) => a.id !== id);
        onUpdate(newData);
    }
  };

  // -- Edit Logic --

  const startEditing = (item: any, type: 'bank' | 'asset') => {
    const history = item.history || {};
    // Normalize field name for form: use 'value' for both internally in form
    const formVal = type === 'bank' ? item.balance : item.value;
    setEditingItem({
        type,
        id: item.id,
        form: { ...item, value: formVal, history: { ...history } }
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
  };

  const handleHistoryChange = (monthKey: string, val: string) => {
    if (!editingItem) return;
    const numVal = parseFloat(val) || 0;
    setEditingItem({
      ...editingItem,
      form: {
        ...editingItem.form,
        history: {
          ...editingItem.form.history,
          [monthKey]: numVal
        }
      }
    });
  };

  const saveEditing = () => {
    if (!editingItem) return;
    const newData = JSON.parse(JSON.stringify(yearData));
    
    // Find latest value from history to update current balance/value
    const history = editingItem.form.history || {};
    const months = Object.keys(MONTH_NAMES).sort().reverse();
    let latestVal = editingItem.form.value; 
    
    for (const m of months) {
      if (history[m] !== undefined && history[m] !== 0) {
        latestVal = history[m];
        break;
      }
    }

    if (editingItem.type === 'bank') {
        const index = newData.fortune.bankAccounts.findIndex((b: BankAccount) => b.id === editingItem.id);
        if (index !== -1) {
            newData.fortune.bankAccounts[index] = { 
                ...newData.fortune.bankAccounts[index], 
                name: editingItem.form.name,
                balance: latestVal,
                history: history 
            };
        }
    } else {
        const index = newData.fortune.otherAssets.findIndex((a: Asset) => a.id === editingItem.id);
        if (index !== -1) {
            newData.fortune.otherAssets[index] = { 
                ...newData.fortune.otherAssets[index], 
                name: editingItem.form.name,
                value: latestVal,
                history: history 
            };
        }
    }

    onUpdate(newData);
    setEditingItem(null);
  };

  // -- Chart Data --
  const fortuneChartData = Object.keys(MONTH_NAMES).sort().map(key => {
     // 1. Investments
     const invTotal = yearData.investments.reduce((sum, inv) => sum + (inv.history?.[key] || 0), 0);
     // 2. Bank Accounts
     const bankTotal = yearData.fortune.bankAccounts.reduce((sum, b) => sum + (b.history?.[key] || 0), 0);
     // 3. Other Assets
     const assetTotal = (yearData.fortune.otherAssets || []).reduce((sum, a) => sum + (a.history?.[key] || 0), 0);

     return {
         name: MONTH_NAMES[key].substring(0, 3),
         Total: invTotal + bankTotal + assetTotal
     };
  });

  const bankTotal = yearData.fortune.bankAccounts.reduce((a, b) => a + b.balance, 0);
  const otherAssetsTotal = (yearData.fortune.otherAssets || []).reduce((a, b) => a + b.value, 0);
  const investTotal = yearData.investments.reduce((a, b) => a + b.currentValue, 0);
  
  const totalNetWorth = bankTotal + otherAssetsTotal + investTotal;

  // Render Helper for Edit Form
  const renderEditForm = () => {
    if (!editingItem) return null;
    return (
        <div className="bg-blue-50 p-6 border-l-4 border-blue-500 mb-6 rounded-r-lg">
            <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-blue-900 flex items-center gap-2"><Pencil size={16}/> Édition: {editingItem.form.name}</h4>
            <div className="flex gap-2">
                <button onClick={cancelEditing} className="px-3 py-1 bg-white text-slate-600 rounded border border-slate-200 hover:bg-slate-50 text-sm">Annuler</button>
                <button onClick={saveEditing} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"><Save size={14}/> Enregistrer</button>
            </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-semibold text-blue-800 mb-1">Nom</label>
                <input 
                    type="text" 
                    value={editingItem.form.name} 
                    onChange={e => setEditingItem({...editingItem, form: {...editingItem.form, name: e.target.value}})} 
                    className="w-full md:w-1/2 p-2 border rounded text-sm" 
                />
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
                <h5 className="font-semibold text-sm text-slate-700">Historique Mensuel</h5>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Saisissez les valeurs pour mettre à jour la courbe</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.keys(MONTH_NAMES).sort().map(key => (
                <div key={key}>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">{MONTH_NAMES[key]}</label>
                    <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full p-2 border border-slate-200 rounded text-sm text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editingItem.form.history?.[key] === 0 ? '' : editingItem.form.history?.[key]}
                    onChange={e => handleHistoryChange(key, e.target.value)}
                    />
                </div>
                ))}
            </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <p className="text-slate-300 uppercase tracking-widest text-sm font-medium mb-2">Fortune Nette Totale</p>
          <p className="text-4xl md:text-5xl font-bold">{formatMoney(totalNetWorth, user.currency)}</p>
       </div>
       
       {/* Global Editing Area if active */}
       {editingItem && renderEditForm()}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bank Accounts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Building size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800">Comptes Bancaires</h3>
             </div>
             
             <div className="space-y-4">
                {yearData.fortune.bankAccounts.map(acc => {
                   if (editingItem?.id === acc.id) return null; // Hide if editing
                   return (
                    <div key={acc.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                        <span className="font-medium text-slate-700">{acc.name}</span>
                        <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-800">{formatMoney(acc.balance, user.currency)}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button onClick={() => startEditing(acc, 'bank')} className="text-slate-400 hover:text-blue-500 p-1" title="Éditer"><Pencil size={14}/></button>
                                <button onClick={() => removeBankAccount(acc.id)} className="text-slate-400 hover:text-red-500 p-1" title="Supprimer"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                   );
                })}
                {yearData.fortune.bankAccounts.length === 0 && <p className="text-sm text-slate-400 italic">Aucun compte bancaire.</p>}
             </div>
             
             {!editingItem && (
                <div className="mt-4 flex space-x-2 pt-4 border-t border-slate-100">
                    <input type="text" placeholder="Nom banque" className="flex-1 p-2 border rounded text-sm outline-none focus:border-blue-500" value={newBank.name} onChange={e => setNewBank({...newBank, name: e.target.value})} />
                    <input type="number" placeholder="Solde" className="w-24 p-2 border rounded text-sm outline-none focus:border-blue-500" value={newBank.balance || ''} onChange={e => setNewBank({...newBank, balance: Number(e.target.value)})} />
                    <button onClick={addBankAccount} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={18}/></button>
                </div>
             )}
          </div>

          {/* Other Assets */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Briefcase size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800">Autres Titres</h3>
             </div>
             
             <div className="space-y-4">
                {(yearData.fortune.otherAssets || []).map(asset => {
                  if (editingItem?.id === asset.id) return null; // Hide if editing
                  return (
                    <div key={asset.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                        <span className="font-medium text-slate-700">{asset.name}</span>
                        <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-800">{formatMoney(asset.value, user.currency)}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button onClick={() => startEditing(asset, 'asset')} className="text-slate-400 hover:text-blue-500 p-1" title="Éditer"><Pencil size={14}/></button>
                                <button onClick={() => removeAsset(asset.id)} className="text-slate-400 hover:text-red-500 p-1" title="Supprimer"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                  );
                })}
                 {(yearData.fortune.otherAssets || []).length === 0 && <p className="text-sm text-slate-400 italic">Aucun autre titre.</p>}
             </div>
             
             {!editingItem && (
                <div className="mt-4 flex space-x-2 pt-4 border-t border-slate-100">
                    <input type="text" placeholder="Nom titre (ex. Cash, Immo...)" className="flex-1 p-2 border rounded text-sm outline-none focus:border-emerald-500" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
                    <input type="number" placeholder="Valeur" className="w-24 p-2 border rounded text-sm outline-none focus:border-emerald-500" value={newAsset.value || ''} onChange={e => setNewAsset({...newAsset, value: Number(e.target.value)})} />
                    <button onClick={addAsset} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700"><Plus size={18}/></button>
                </div>
             )}
          </div>

          {/* Investments Summary */}
          <div className="md:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-100 flex justify-between items-center">
             <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Portefeuille d'Investissements</h3>
                <p className="text-xs text-slate-400 mt-1">Actions, ETF, Crypto (Calculé via l'onglet Investissements)</p>
             </div>
             <p className="text-3xl font-bold text-slate-700">{formatMoney(investTotal, user.currency)}</p>
          </div>
       </div>

        {/* Global Net Worth Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-8">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Évolution de la Fortune Nette Totale</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fortuneChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatMoney(value, user.currency)}
                />
                <Area type="monotone" dataKey="Total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
           <p className="text-xs text-slate-400 mt-4 text-center">
            * Ce graphique compile l'historique de tous vos actifs (Investissements + Comptes Bancaires + Autres titres).
          </p>
        </div>
    </div>
  );
};
