import React, { useState, useEffect } from 'react';
import { User, ExpenseItem, ExpenseCategoryType, EXCHANGE_RATES } from '../../types';
import { MONTHS, DEFAULT_EXPENSE_CATEGORIES } from '../../constants';
import { getExpenses, saveExpense, deleteExpense } from '../../services/storage';
import { Button } from '../ui/Button';
import { Plus, Trash2, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  user: User;
  year: number;
}

export const ExpenseSection: React.FC<Props> = ({ user, year }) => {
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  
  // State for managing new subcategory inputs per main category
  const [newSubCats, setNewSubCats] = useState<Record<string, string>>({});
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    [ExpenseCategoryType.FIXED]: true,
    [ExpenseCategoryType.WORK]: true,
    [ExpenseCategoryType.OTHER]: true,
  });

  const rate = EXCHANGE_RATES[user.preferredCurrency];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, year]);

  const loadData = () => {
    const allExpenses = getExpenses(user.id);
    setExpenses(allExpenses.filter(e => e.year === year));
  };

  const getMonthlyExpenses = (monthIndex: number) => {
    return expenses.filter(e => e.month === monthIndex);
  };

  const toggleExpand = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSaveAmount = (mainCat: ExpenseCategoryType, subCat: string, amountStr: string, id?: string) => {
    const val = parseFloat(amountStr);
    const amountInCHF = isNaN(val) ? 0 : val / rate;

    const newItem: ExpenseItem = {
      id: id || crypto.randomUUID(),
      userId: user.id,
      year,
      month: activeMonth,
      mainCategory: mainCat,
      subCategoryName: subCat,
      amount: amountInCHF
    };
    saveExpense(newItem);
    loadData();
  };

  const handleAddSubCategory = (mainCat: ExpenseCategoryType) => {
    const name = newSubCats[mainCat];
    if (!name?.trim()) return;

    const newItem: ExpenseItem = {
      id: crypto.randomUUID(),
      userId: user.id,
      year,
      month: activeMonth,
      mainCategory: mainCat,
      subCategoryName: name,
      amount: 0
    };
    saveExpense(newItem);
    setNewSubCats(prev => ({ ...prev, [mainCat]: '' }));
    loadData();
  };

  const handleDelete = (id?: string) => {
    if (id) {
      deleteExpense(id);
      loadData();
    }
  };

  // Preparation of display data
  const currentMonthData = getMonthlyExpenses(activeMonth);
  const annualTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyTotal = currentMonthData.reduce((acc, curr) => acc + curr.amount, 0);

  const renderCategoryGroup = (categoryType: ExpenseCategoryType) => {
    // Merge defaults with stored items for this category type
    const storedInGroup = currentMonthData.filter(e => e.mainCategory === categoryType);
    const displayList: { id?: string, name: string, amount: number }[] = [];

    // Defaults
    DEFAULT_EXPENSE_CATEGORIES[categoryType].forEach(subName => {
      const found = storedInGroup.find(s => s.subCategoryName === subName);
      displayList.push({
        id: found?.id,
        name: subName,
        amount: found ? found.amount : 0
      });
    });

    // Custom added ones
    storedInGroup.forEach(s => {
      if (!DEFAULT_EXPENSE_CATEGORIES[categoryType].includes(s.subCategoryName)) {
        displayList.push({ id: s.id, name: s.subCategoryName, amount: s.amount });
      }
    });

    const groupTotal = displayList.reduce((acc, curr) => acc + curr.amount, 0);
    const isExpanded = expandedCats[categoryType];

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div 
          className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => toggleExpand(categoryType)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span className="font-semibold text-gray-700">{categoryType}</span>
          </div>
          <span className="font-bold text-gray-900">
            {(groupTotal * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
          </span>
        </div>

        {isExpanded && (
          <div className="p-4 bg-white space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {displayList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 text-sm text-gray-600 pl-6">{item.name}</div>
                <div className="relative w-40">
                  <input
                    type="number"
                    defaultValue={item.amount > 0 ? (item.amount * rate).toFixed(2) : ''}
                    placeholder="0.00"
                    onBlur={(e) => handleSaveAmount(categoryType, item.name, e.target.value, item.id)}
                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-right font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    {user.preferredCurrency}
                  </span>
                </div>
                {!DEFAULT_EXPENSE_CATEGORIES[categoryType].includes(item.name) && (
                   <button 
                   onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                   className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                 >
                   <Trash2 size={16} />
                 </button>
                )}
              </div>
            ))}

            {/* Add Subcategory Input */}
            <div className="flex items-center gap-3 mt-3 pl-6">
              <input
                type="text"
                placeholder="Nouvelle sous-catégorie..."
                value={newSubCats[categoryType] || ''}
                onChange={(e) => setNewSubCats(prev => ({ ...prev, [categoryType]: e.target.value }))}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleAddSubCategory(categoryType)}
                disabled={!newSubCats[categoryType]}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
       {/* Header Stats */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">Dépenses Annuelles ({year})</h3>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {(annualTotal * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
          </p>
        </div>
        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
          <TrendingDown className="text-red-600" size={24} />
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

        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">Dépenses de {MONTHS[activeMonth]}</h4>
          
          {Object.values(ExpenseCategoryType).map(catType => renderCategoryGroup(catType))}

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total Mensuel</span>
            <span className="text-2xl font-bold text-gray-900">
              {(monthlyTotal * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};