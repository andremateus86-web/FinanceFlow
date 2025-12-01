import React, { useState } from 'react';
import { YearData, MONTH_NAMES, MonthData, User } from '../types';
import { formatMoney, calculateMonthTotal, calculateYearTotal } from '../utils';
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react';

interface MonthInputProps {
  type: 'entrees' | 'depenses';
  yearData: YearData;
  user: User;
  onUpdate: (updatedYearData: YearData) => void;
}

export const MonthInput: React.FC<MonthInputProps> = ({ type, yearData, user, onUpdate }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("01");
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // States for renaming feature
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState("");

  const currentMonthData = yearData.months[selectedMonth];
  const sectionData = currentMonthData[type];

  // Colors based on type
  const themeColor = type === 'entrees' ? 'emerald' : 'rose';
  const displayTitle = type === 'entrees' ? 'Entrées' : 'Dépenses';

  const handleAmountChange = (category: string, value: string, isCustom: boolean) => {
    const numValue = parseFloat(value) || 0;
    
    // Deep clone to avoid mutation reference bugs
    const newYearData = JSON.parse(JSON.stringify(yearData));
    const targetSection = newYearData.months[selectedMonth][type];
    
    if (isCustom) {
      targetSection.custom[category] = numValue;
    } else {
      targetSection.base[category] = numValue;
    }

    onUpdate(newYearData);
  };

  const startEditing = (category: string) => {
    setEditingCategory(category);
    setTempCategoryName(category);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setTempCategoryName("");
  };

  const saveCategoryRename = (oldName: string, isCustom: boolean) => {
    if (!tempCategoryName.trim() || tempCategoryName === oldName) {
      cancelEditing();
      return;
    }

    const newYearData = JSON.parse(JSON.stringify(yearData));
    const section = newYearData.months[selectedMonth][type][isCustom ? 'custom' : 'base'];

    // Check if name already exists
    if (section[tempCategoryName] !== undefined) {
      alert("Une catégorie avec ce nom existe déjà pour ce mois.");
      return;
    }

    // Preserve value
    const val = section[oldName];
    
    // Create new object to maintain order (mostly) or just swap keys
    // To cleanly replace:
    const newSection: Record<string, number> = {};
    Object.keys(section).forEach(key => {
        if (key === oldName) {
            newSection[tempCategoryName] = val;
        } else {
            newSection[key] = section[key];
        }
    });

    newYearData.months[selectedMonth][type][isCustom ? 'custom' : 'base'] = newSection;

    onUpdate(newYearData);
    cancelEditing();
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newYearData = JSON.parse(JSON.stringify(yearData));
    
    // We only add the structure to the current month as per instructions
    if (!newYearData.months[selectedMonth][type].custom[newCategoryName]) {
      newYearData.months[selectedMonth][type].custom[newCategoryName] = 0;
      onUpdate(newYearData);
      setNewCategoryName("");
    }
  };

  const removeCategory = (category: string) => {
    if (!window.confirm(`Supprimer la catégorie "${category}" ?`)) return;
    const newYearData = JSON.parse(JSON.stringify(yearData));
    delete newYearData.months[selectedMonth][type].custom[category];
    onUpdate(newYearData);
  };

  const monthKeys = Object.keys(MONTH_NAMES).sort();
  const currentIndex = monthKeys.indexOf(selectedMonth);

  const prevMonth = () => {
    if(currentIndex > 0) setSelectedMonth(monthKeys[currentIndex - 1]);
  };

  const nextMonth = () => {
    if(currentIndex < monthKeys.length - 1) setSelectedMonth(monthKeys[currentIndex + 1]);
  };

  const annualTotal = calculateYearTotal(type, yearData) as number;
  const monthlyTotal = calculateMonthTotal(type, currentMonthData) as number;

  // Helper to render a category row
  const renderCategoryRow = (cat: string, val: number, isCustom: boolean) => {
    const isEditing = editingCategory === cat;

    return (
      <div key={cat} className="flex items-center justify-between group h-10">
        <div className="flex items-center space-x-2 flex-1">
           {/* Actions: Delete (Custom only) */}
           {isCustom && !isEditing && (
            <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">
              <Trash2 size={16} />
            </button>
           )}
           {!isCustom && !isEditing && (
             <div className="w-4"></div> // Spacer for alignment
           )}

           {/* Name Display or Edit Input */}
           {isEditing ? (
             <div className="flex items-center space-x-1">
               <input 
                  type="text" 
                  autoFocus
                  value={tempCategoryName}
                  onChange={(e) => setTempCategoryName(e.target.value)}
                  className="px-2 py-1 border border-blue-300 rounded text-sm w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') saveCategoryRename(cat, isCustom);
                    if(e.key === 'Escape') cancelEditing();
                  }}
               />
               <button onClick={() => saveCategoryRename(cat, isCustom)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={16}/></button>
               <button onClick={cancelEditing} className="text-red-600 hover:bg-red-50 p-1 rounded"><X size={16}/></button>
             </div>
           ) : (
             <div className="flex items-center space-x-2">
                <label className="text-slate-600 font-medium cursor-pointer" onClick={() => startEditing(cat)} title="Cliquer pour renommer">{cat}</label>
                <button onClick={() => startEditing(cat)} className="text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity scale-90">
                  <Pencil size={14} />
                </button>
             </div>
           )}
        </div>

        {/* Amount Input */}
        <div className="relative w-40">
          <input 
            type="number" 
            min="0" 
            step="0.01"
            value={val === 0 ? '' : val} 
            placeholder="0.00"
            disabled={isEditing}
            onChange={(e) => handleAmountChange(cat, e.target.value, isCustom)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right disabled:bg-slate-50 disabled:text-slate-400"
          />
          <span className="absolute right-3 top-2 text-slate-400 text-sm">{user.currency}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className={`text-2xl font-bold text-${themeColor}-600 capitalize`}>{displayTitle}</h2>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button onClick={prevMonth} disabled={currentIndex === 0} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30">
            <ChevronLeft />
          </button>
          <span className="text-xl font-medium w-32 text-center text-slate-800">{MONTH_NAMES[selectedMonth]}</span>
          <button onClick={nextMonth} disabled={currentIndex === 11} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30">
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Base Categories */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Catégories de Base</h3>
            <div className="space-y-4">
              {Object.entries(sectionData.base).map(([cat, val]) => renderCategoryRow(cat, val as number, false))}
            </div>
          </div>

          {/* Custom Categories */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Catégories Personnalisées</h3>
            
            <div className="space-y-4 mb-6">
              {Object.entries(sectionData.custom).map(([cat, val]) => renderCategoryRow(cat, val as number, true))}
              {Object.keys(sectionData.custom).length === 0 && (
                <p className="text-sm text-slate-400 italic">Aucune catégorie personnalisée pour ce mois.</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
              <input 
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Nouvelle catégorie..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={addCategory}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className={`bg-${themeColor}-50 p-6 rounded-xl border border-${themeColor}-100`}>
            <p className={`text-${themeColor}-700 font-medium mb-1`}>Total {MONTH_NAMES[selectedMonth]}</p>
            <p className={`text-3xl font-bold text-${themeColor}-700`}>{formatMoney(monthlyTotal, user.currency)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-slate-500 font-medium uppercase tracking-wide text-xs mb-2">Total Annuel ({yearData.year})</h3>
             <p className="text-2xl font-bold text-slate-800">{formatMoney(annualTotal, user.currency)}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            <p>ℹ️ Les modifications sont enregistrées automatiquement pour le mois en cours. Vous pouvez renommer les catégories en cliquant sur le crayon qui apparaît au survol.</p>
          </div>
        </div>
      </div>
    </div>
  );
};