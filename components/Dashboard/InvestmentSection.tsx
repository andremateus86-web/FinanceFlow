
import React, { useState, useEffect } from 'react';
import { User, InvestmentItem, EXCHANGE_RATES } from '../../types';
import { getInvestments, saveInvestment, deleteInvestment } from '../../services/storage';
import { Button } from '../ui/Button';
import { Plus, Trash2, PieChart as PieIcon, Pencil, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  user: User;
  year: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export const InvestmentSection: React.FC<Props> = ({ user, year }) => {
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  
  // State for managing new subcategory inputs per main category
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const rate = EXCHANGE_RATES[user.preferredCurrency];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const loadData = () => {
    // Ensure legacy data without history is handled
    const raw = getInvestments(user.id);
    const withHistory = raw.map(inv => ({
      ...inv,
      history: inv.history || [{ date: inv.dateCreated, amount: inv.amount }]
    }));
    setInvestments(withHistory);
  };

  const handleAdd = () => {
    if (!newName || !newAmount) return;
    // Handle comma input for French users
    const cleanAmount = newAmount.replace(',', '.');
    const val = parseFloat(cleanAmount);
    if (isNaN(val)) return;

    const amountInBase = val / rate;
    const now = new Date().toISOString();

    const newItem: InvestmentItem = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: newName,
      amount: amountInBase,
      dateCreated: now,
      history: [{ date: now, amount: amountInBase }]
    };
    saveInvestment(newItem);
    setNewName('');
    setNewAmount('');
    setIsAdding(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
    loadData();
  };

  const startEdit = (inv: InvestmentItem) => {
    setEditingId(inv.id);
    // Display current value with 2 decimals
    setEditValue((inv.amount * rate).toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = (inv: InvestmentItem) => {
    // Handle comma input which might be used in French locale
    const cleanValue = editValue.replace(',', '.');
    const val = parseFloat(cleanValue);
    
    // If invalid or empty, we abort or could show error. 
    // Here we abort to prevent saving NaN.
    if (isNaN(val)) return;

    const newAmountInBase = val / rate;
    const now = new Date().toISOString();

    const updatedItem: InvestmentItem = {
      ...inv,
      amount: newAmountInBase, // Updates the current display value
      history: [...inv.history, { date: now, amount: newAmountInBase }] // Adds to history
    };
    
    saveInvestment(updatedItem);
    setEditingId(null);
    setEditValue('');
    loadData();
  };

  const totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);

  // Pie Chart Data
  const pieData = investments.map(inv => ({
    name: inv.name,
    value: inv.amount * rate
  }));

  // --- Real Progression Logic ---
  const calculateHistoricalData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    return months.map((monthName, index) => {
      // Calculate the date for the end of this month in the selected year
      // Use end of day to include updates made on the last day of the month
      const date = new Date(year, index + 1, 0, 23, 59, 59, 999); 
      const isoDate = date.toISOString();

      // For each investment, find the latest history entry before or on this date
      let monthlyTotal = 0;
      
      investments.forEach(inv => {
        // Filter history for entries <= current month end
        // This ensures past months use past values, and current/future months use new values
        const relevantHistory = inv.history
          .filter(h => h.date <= isoDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending by date

        if (relevantHistory.length > 0) {
          monthlyTotal += relevantHistory[0].amount;
        } else {
           // If created after this month, it contributes 0
        }
      });

      return {
        month: monthName,
        valeur: monthlyTotal * rate
      };
    });
  };

  const progressionData = calculateHistoricalData();

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Total */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-lg font-bold text-gray-800">Portefeuille d'Investissements</h2>
           <p className="text-gray-500 text-sm">Valeur totale actuelle</p>
        </div>
        <div className="text-3xl font-bold text-indigo-600">
           {(totalInvestments * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Annuler' : 'Nouveau investissement'}
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-semibold text-indigo-900 mb-4">Ajouter un actif</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Nom (ex: ETF S&P 500)" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="relative w-48">
                <input 
                type="text" 
                placeholder="Montant"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{user.preferredCurrency}</span>
            </div>
            
            <Button onClick={handleAdd} disabled={!newName || !newAmount}>
              <Plus size={18} className="mr-2"/> Créer
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 font-medium text-gray-700">Vos Actifs</div>
           {investments.length === 0 ? (
             <div className="p-8 text-center text-gray-400">Aucun investissement pour le moment.</div>
           ) : (
             <table className="w-full">
               <tbody className="divide-y divide-gray-100">
                 {investments.map((inv) => (
                   <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="px-6 py-4 font-medium text-gray-800">{inv.name}</td>
                     <td className="px-6 py-4 text-right font-mono text-gray-700">
                        {editingId === inv.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input 
                              autoFocus
                              type="text" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(inv);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              className="w-32 px-2 py-1 text-right border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="0.00"
                            />
                            <button onClick={() => saveEdit(inv)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={16}/></button>
                            <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={16}/></button>
                          </div>
                        ) : (
                          (inv.amount * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })
                        )}
                     </td>
                     <td className="px-6 py-4 w-24 text-right">
                       <div className="flex justify-end gap-2">
                         {editingId !== inv.id && (
                           <>
                             <button onClick={() => startEdit(inv)} title="Mettre à jour la valeur" className="text-gray-300 hover:text-indigo-600 transition-colors">
                               <Pencil size={16} />
                             </button>
                             <button onClick={() => handleDelete(inv.id)} title="Supprimer" className="text-gray-300 hover:text-red-500 transition-colors">
                               <Trash2 size={16} />
                             </button>
                           </>
                         )}
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
           <h3 className="text-sm font-medium text-gray-500 mb-2 w-full text-left">Répartition</h3>
           {investments.length > 0 ? (
             <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                 <Pie
                   data={pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value: number) => value.toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           ) : (
             <div className="text-gray-300 flex flex-col items-center">
               <PieIcon size={48} className="mb-2" opacity={0.5}/>
               <span>Pas de données</span>
             </div>
           )}
        </div>
      </div>

      {/* Progression Graph */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Progression Annuelle ({year})</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progressionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <Tooltip formatter={(value: number) => value.toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })} />
            <Line type="monotone" dataKey="valeur" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} activeDot={{r: 6}} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
