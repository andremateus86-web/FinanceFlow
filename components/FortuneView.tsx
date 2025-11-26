
import React, { useState, useEffect } from 'react';
import { User, FortuneItem, InvestmentItem, EXCHANGE_RATES } from '../types';
import { getFortuneItems, saveFortuneItem, deleteFortuneItem, getInvestments } from '../services/storage';
import { Button } from './ui/Button';
import { Plus, Trash2, Landmark, Wallet, Pencil, Check, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  user: User;
}

export const FortuneView: React.FC<Props> = ({ user }) => {
  const [fortuneItems, setFortuneItems] = useState<FortuneItem[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const rate = EXCHANGE_RATES[user.preferredCurrency];
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const loadData = () => {
    // Load Fortune Items and ensure history exists
    const rawFortune = getFortuneItems(user.id);
    const fortuneWithHistory = rawFortune.map(f => ({
      ...f,
      history: f.history || [{ date: f.dateCreated, amount: f.amount }]
    }));
    setFortuneItems(fortuneWithHistory);

    // Load Investments for the chart calculation
    const rawInvestments = getInvestments(user.id);
    const invWithHistory = rawInvestments.map(inv => ({
      ...inv,
      history: inv.history || [{ date: inv.dateCreated, amount: inv.amount }]
    }));
    setInvestments(invWithHistory);
  };

  // Helper to safely parse localized number strings (e.g. "1 000,50" -> 1000.50)
  const parseAmount = (value: string): number => {
    const clean = value.replace(/['\s]/g, '');
    const standard = clean.replace(',', '.');
    return parseFloat(standard);
  };

  const handleAdd = () => {
    if (!newName || !newAmount) return;
    const val = parseAmount(newAmount);
    if (isNaN(val)) return;

    const amountInBase = val / rate;
    const now = new Date().toISOString();

    const newItem: FortuneItem = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: newName,
      amount: amountInBase,
      dateCreated: now,
      history: [{ date: now, amount: amountInBase }]
    };
    saveFortuneItem(newItem);
    setNewName('');
    setNewAmount('');
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteFortuneItem(id);
    loadData();
  };

  // --- Edit Logic ---
  const startEdit = (item: FortuneItem) => {
    setEditingId(item.id);
    setEditValue((item.amount * rate).toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = (item: FortuneItem) => {
    const val = parseAmount(editValue);
    if (isNaN(val)) return;

    const newAmountInBase = val / rate;
    const now = new Date().toISOString();

    const updatedItem: FortuneItem = {
      ...item,
      amount: newAmountInBase,
      history: [...item.history, { date: now, amount: newAmountInBase }]
    };

    saveFortuneItem(updatedItem);
    setEditingId(null);
    setEditValue('');
    loadData();
  };

  // --- Chart Logic ---
  const calculateNetWorthHistory = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    return months.map((monthName, index) => {
      // End of month date for the current year
      const date = new Date(currentYear, index + 1, 0, 23, 59, 59, 999); 
      const isoDate = date.toISOString();

      const getHistoricalTotal = (items: (FortuneItem | InvestmentItem)[]) => {
        let total = 0;
        items.forEach(item => {
          const relevantHistory = item.history
            .filter(h => h.date <= isoDate)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (relevantHistory.length > 0) {
            total += relevantHistory[0].amount;
          }
        });
        return total;
      };

      const fortuneTotal = getHistoricalTotal(fortuneItems);
      const invTotal = getHistoricalTotal(investments);

      return {
        month: monthName,
        valeur: (fortuneTotal + invTotal) * rate
      };
    });
  };

  const progressionData = calculateNetWorthHistory();

  const fortuneTotalCurrent = fortuneItems.reduce((acc, curr) => acc + curr.amount, 0);
  const investmentTotalCurrent = investments.reduce((acc, curr) => acc + curr.amount, 0);
  const globalNetWorth = fortuneTotalCurrent + investmentTotalCurrent;

  return (
    <div className="space-y-6">
      
      {/* Header Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-lg font-bold text-gray-800">Fortune Nette</h2>
           <p className="text-gray-500 text-sm">Vue d'ensemble de votre patrimoine global.</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-6 py-4 rounded-xl shadow-lg">
           <div className="text-indigo-100 text-sm font-medium mb-1">Fortune Globale Actuelle</div>
           <div className="text-3xl font-bold">
             {(globalNetWorth * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Assets Card (Editable) */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                <Wallet size={18} className="text-indigo-500"/> Autres Actifs
              </div>
              <span className="font-bold text-gray-900">
                {(fortuneTotalCurrent * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
              </span>
            </div>
            
            <div className="p-6 space-y-4">
               {/* Add Form */}
               <div className="flex gap-2 mb-6">
                 <input 
                    type="text" 
                    placeholder="Ex: Immobilier..." 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
                 <div className="relative w-28">
                    <input 
                      type="text" 
                      placeholder="Montant" 
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <Button size="sm" onClick={handleAdd} disabled={!newName || !newAmount}>
                   <Plus size={16}/>
                 </Button>
               </div>

               {/* List */}
               <div className="space-y-3">
                 {fortuneItems.map(item => (
                   <div key={item.id} className="flex justify-between items-center group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="text-gray-600 font-medium">{item.name}</span>
                      
                      <div className="flex items-center justify-end gap-3 flex-1 ml-4">
                         {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                                <input 
                                  autoFocus
                                  type="text" 
                                  value={editValue} 
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(item);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="w-24 px-2 py-1 text-right text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                                <button onClick={() => saveEdit(item)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
                                <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                            </div>
                         ) : (
                            <>
                                <span className="font-mono text-gray-800">
                                    {(item.amount * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-indigo-600 p-1">
                                        <Pencil size={14}/>
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </>
                         )}
                      </div>
                   </div>
                 ))}
                 {fortuneItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun actif ajouté.</p>}
               </div>
            </div>
         </div>

         {/* Investments Summary Card (Read Only here) */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                <Landmark size={18} className="text-emerald-500"/> Investissements
              </div>
              <span className="font-bold text-gray-900">
                {(investmentTotalCurrent * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
              </span>
            </div>
            <div className="p-6 flex flex-col items-center justify-center h-full text-center pb-12">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <Landmark size={32} className="text-emerald-600" />
               </div>
               <p className="text-gray-600 font-medium mb-1">Portefeuille d'Investissements</p>
               <p className="text-gray-400 text-sm mb-4">Valeur gérée dans l'onglet dédié</p>
               <div className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                 Synchronisé automatiquement
               </div>
            </div>
         </div>
      </div>

      {/* Net Worth Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Évolution de la Fortune Nette ({currentYear})</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progressionData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <Tooltip 
              formatter={(value: number) => value.toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}  
            />
            <Line 
              type="monotone" 
              dataKey="valeur" 
              stroke="#3b82f6" 
              strokeWidth={4} 
              dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} 
              activeDot={{r: 8}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
