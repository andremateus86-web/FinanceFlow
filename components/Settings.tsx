import React, { useState } from 'react';
import { User, AppState, UserType } from '../types';
import { generateId } from '../utils';
import { exportToJSON, exportToCSV, exportToPDF } from '../services/exportService';
import { Users, FileDown, FileUp, Plus, UserPlus } from 'lucide-react';

interface SettingsProps {
  appState: AppState;
  addUser: (user: User) => void;
  importData: (jsonData: any) => void;
  currentUser: User;
}

export const Settings: React.FC<SettingsProps> = ({ appState, addUser, importData, currentUser }) => {
  const [newUser, setNewUser] = useState<{ name: string; type: UserType; currency: string }>({ 
    name: '', 
    type: 'individuel', 
    currency: 'CHF' 
  });
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreateUser = () => {
    if (!newUser.name) return;
    addUser({
      id: generateId(),
      name: newUser.name,
      type: newUser.type,
      currency: newUser.currency,
      members: newUser.type === 'commun' ? [] : undefined
    });
    setNewUser({ name: '', type: 'individuel', currency: 'CHF' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.metadata && json.metadata.type === 'financeflow_export') {
           importData(json);
           setImportError(null);
           alert("Import réussi !");
        } else {
           setImportError("Format de fichier invalide.");
        }
      } catch (err) {
        setImportError("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Get current user's data for export
  const currentData = appState.data[currentUser.id] || {};

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Users Management */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={24}/></div>
          <h2 className="text-xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-slate-700 mb-4">Utilisateurs Existants</h3>
            <ul className="space-y-2">
              {appState.users.map(u => (
                <li key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${u.type === 'commun' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded border border-slate-200 text-slate-500 uppercase">{u.type}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><UserPlus size={18}/> Créer un profil</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nom du profil</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex. Jean Dupont"
                />
              </div>
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                    <select 
                      value={newUser.type} 
                      onChange={e => setNewUser({...newUser, type: e.target.value as any})}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    >
                      <option value="individuel">Individuel</option>
                      <option value="commun">Compte Commun</option>
                    </select>
                 </div>
                 <div className="w-24">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Devise</label>
                    <select 
                      value={newUser.currency} 
                      onChange={e => setNewUser({...newUser, currency: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    >
                      <option value="CHF">CHF</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                 </div>
              </div>
              <button 
                onClick={handleCreateUser}
                className="w-full bg-slate-800 text-white py-2 rounded-md hover:bg-slate-700 transition-colors flex justify-center items-center gap-2 mt-2"
              >
                <Plus size={16}/> Créer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Control */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FileDown size={24}/></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Export de données</h2>
                <p className="text-sm text-slate-500">Sauvegardez ou analysez vos données</p>
             </div>
           </div>
           
           <div className="space-y-3">
             <button 
               onClick={() => exportToJSON(currentUser, currentData)}
               className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
             >
               <span className="font-medium text-slate-700">Format JSON</span>
               <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Sauvegarde complète</span>
             </button>
             <button 
               onClick={() => exportToCSV(currentUser, currentData)}
               className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
             >
               <span className="font-medium text-slate-700">Format CSV (Excel)</span>
               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Tableur</span>
             </button>
             <button 
                onClick={() => {
                  const currentYearData = currentData[appState.activeYear];
                  if(currentYearData) exportToPDF(currentUser, currentYearData);
                  else alert("Aucune donnée pour cette année.");
                }}
               className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
             >
               <span className="font-medium text-slate-700">Rapport PDF</span>
               <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Année {appState.activeYear}</span>
             </button>
           </div>
        </div>

        {/* Import */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FileUp size={24}/></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Import de données</h2>
                <p className="text-sm text-slate-500">Restaurez une sauvegarde JSON</p>
             </div>
           </div>

           <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileUp className="mx-auto text-slate-400 mb-3" size={32} />
              <p className="font-medium text-slate-600">Cliquez pour sélectionner un fichier JSON</p>
              <p className="text-xs text-slate-400 mt-2">Cela remplacera ou fusionnera les données de l'utilisateur inclus dans le fichier.</p>
           </div>
           {importError && (
             <p className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{importError}</p>
           )}
        </div>

      </section>
    </div>
  );
};