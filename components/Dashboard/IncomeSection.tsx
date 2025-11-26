import React, { useState, useEffect } from 'react';
import { User, IncomeItem, Currency, EXCHANGE_RATES } from '../../types';
import { MONTHS, DEFAULT_INCOME_CATEGORIES } from '../../constants';
import { getIncomes, saveIncome, deleteIncome } from '../../services/storage';
import { Button } from '../ui/Button';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

interface Props {
  user: User;
  year: number;
}

export const IncomeSection: React.FC<Props> = ({ user, year }) => {
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // Rate multiplier based on user preference vs Base (CHF)
  // NOTE: For this demo, we assume stored values are in CHF. 
  // If stored values were raw, we'd need a "transaction currency" field.
  // Here we display converted values.
  const rate = EXCHANGE_RATES[user.preferredCurrency];
  
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, year]);

  const loadData = () => {
    const allIncomes = getIncomes(user.id);
    setIncomes(allIncomes.filter(i => i.year === year));
  };

  const getMonthlyIncomes = (monthIndex: number) => {
    return incomes.filter(i => i.month === monthIndex);
  };

  // Ensure default categories exist for the month if no data
  const getCurrentMonthData = () => {
    const currentData = getMonthlyIncomes(activeMonth);
    const usedCategories = new Set(currentData.map(i => i.categoryName));
    
    // We display inputs for existing records + inputs for default categories not yet used
    // But for a cleaner UI, let's just show rows that exist, and allow adding new ones easily.
    // However, the requirement says "Show the following income categories...".
    // So we should merge stored data with default structure.
    
    const displayList: { id?: string, category: string, amount: number }[] = [];
    
    // Add defaults if they don't exist
    DEFAULT_INCOME_CATEGORIES.forEach(cat => {
      const found = currentData.find(d => d.categoryName === cat);
      if (found) {
        displayList.push({ id: found.id, category: found.categoryName, amount: found.amount });
      } else {
        displayList.push({ category: cat, amount: 0 });
      }
    });

    // Add customs (those in currentData that are NOT in defaults)
    currentData.forEach(d => {
      if (!DEFAULT_INCOME_CATEGORIES.includes(d.categoryName)) {
        displayList.push({ id: d.id, category: d.categoryName, amount: d.amount });
      }
    });

    return displayList;
  };

  const handleSaveAmount = (category: string, amountStr: string, id?: string) => {
    const val = parseFloat(amountStr);
    const amountInCHF = isNaN(val) ? 0 : val / rate; // Convert back to base for storage

    const newItem: IncomeItem = {
      id: id || crypto.randomUUID(),
      userId: user.id,
      year,
      month: activeMonth,
      categoryName: category,
      amount: amountInCHF
    };
    saveIncome(newItem);
    loadData();
  };

  const handleDelete = (id?: string) => {
    if (id) {
      deleteIncome(id);
      loadData();
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    // Just create an entry with 0 amount to "initialize" the row
    const newItem: IncomeItem = {
      id: crypto.randomUUID(),
      userId: user.id,
      year,
      month: activeMonth,
      categoryName: newCategory,
      amount: 0
    };
    saveIncome(newItem);
    setNewCategory('');
    loadData();
  };

  const currentTotal = getMonthlyIncomes(activeMonth).reduce((acc, curr) => acc + curr.amount, 0);
  const annualTotal = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">Revenu Annuel Total ({year})</h3>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {(annualTotal * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
          </p>
        </div>
        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
          <TrendingUp className="text-green-600" size={24} />
        </div>
      </div>

      {/* Month Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              onClick={() => setActiveMonth(idx)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeMonth === idx 
                  ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Entrées de {MONTHS[activeMonth]}</h4>
          
          <div className="space-y-4">
            {getCurrentMonthData().map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="flex-1 bg-gray-50 px-4 py-3 rounded-lg text-gray-700 font-medium border border-transparent group-hover:border-gray-200 transition-colors">
                  {item.category}
                </div>
                <div className="relative w-48">
                  <input
                    type="number"
                    defaultValue={item.amount > 0 ? (item.amount * rate).toFixed(2) : ''}
                    placeholder="0.00"
                    onBlur={(e) => handleSaveAmount(item.category, e.target.value, item.id)}
                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-right font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {user.preferredCurrency}
                  </span>
                </div>
                {/* Only allow deleting if it has an ID (saved) and is not a default category, 
                    OR allow clearing if it is default? Requirement says "Add or Remove". 
                    Let's allow removing custom ones. */}
                {!DEFAULT_INCOME_CATEGORIES.includes(item.category) && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            
            {/* Add Custom Category */}
            <div className="flex items-center gap-4 pt-4 border-t border-dashed border-gray-200">
              <input 
                type="text" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nom nouvelle catégorie..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <Button size="sm" variant="secondary" onClick={handleAddCategory} disabled={!newCategory}>
                <Plus size={16} className="mr-2" /> Ajouter
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total Mensuel</span>
            <span className="text-2xl font-bold text-gray-900">
              {(currentTotal * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};