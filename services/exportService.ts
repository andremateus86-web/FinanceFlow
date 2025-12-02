import { AppState, YearData, MONTH_NAMES, User } from '../types';
import { calculateMonthTotal, calculateYearTotal, formatMoney } from '../utils';

// Declare jsPDF global for TypeScript since we are loading via CDN
declare const jspdf: any;

export const exportToJSON = (user: User, data: Record<number, YearData>) => {
  const exportObject = {
    metadata: {
      version: "1.0",
      exportDate: new Date().toISOString(),
      type: "financeflow_export"
    },
    user,
    data
  };

  const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeflow_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (user: User, data: Record<number, YearData>) => {
  const rows = [['Utilisateur', 'Année', 'Mois', 'Type', 'Catégorie', 'Montant']];

  Object.values(data).forEach(yearData => {
    const year = yearData.year;
    
    // Process Months
    Object.entries(yearData.months).forEach(([monthKey, monthData]) => {
      // Incomes
      Object.entries(monthData.entrees.base).forEach(([cat, val]) => {
        if (val !== 0) rows.push([user.name, year.toString(), monthKey, 'Entrée', cat, val.toFixed(2)]);
      });
      Object.entries(monthData.entrees.custom).forEach(([cat, val]) => {
        if (val !== 0) rows.push([user.name, year.toString(), monthKey, 'Entrée', cat, val.toFixed(2)]);
      });

      // Expenses
      Object.entries(monthData.depenses.base).forEach(([cat, val]) => {
        if (val !== 0) rows.push([user.name, year.toString(), monthKey, 'Dépense', cat, val.toFixed(2)]);
      });
      Object.entries(monthData.depenses.custom).forEach(([cat, val]) => {
        if (val !== 0) rows.push([user.name, year.toString(), monthKey, 'Dépense', cat, val.toFixed(2)]);
      });
    });
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(";")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `financeflow_${user.name}_dump.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (user: User, yearData: YearData) => {
  if (typeof jspdf === 'undefined') {
    alert("La librairie PDF n'est pas chargée.");
    return;
  }

  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(`Rapport Financier: ${user.name}`, 14, 22);
  doc.setFontSize(14);
  doc.text(`Année ${yearData.year}`, 14, 32);

  // Totals
  const totalIncome = calculateYearTotal('entrees', yearData);
  const totalExpenses = calculateYearTotal('depenses', yearData);
  const balance = totalIncome - totalExpenses;

  doc.setFontSize(12);
  doc.text(`Entrées Totales: ${formatMoney(totalIncome, user.currency)}`, 14, 45);
  doc.text(`Dépenses Totales: ${formatMoney(totalExpenses, user.currency)}`, 14, 52);
  doc.text(`Balance: ${formatMoney(balance, user.currency)}`, 14, 59);

  // Table Data
  const tableData: any[] = [];
  const monthKeys = Object.keys(MONTH_NAMES).sort();
  
  monthKeys.forEach(key => {
    const m = yearData.months[key];
    const income = calculateMonthTotal('entrees', m);
    const expense = calculateMonthTotal('depenses', m);
    const bal = income - expense;
    tableData.push([
      MONTH_NAMES[key],
      formatMoney(income, user.currency),
      formatMoney(expense, user.currency),
      formatMoney(bal, user.currency)
    ]);
  });
  
  tableData.push([
    "TOTAL",
    formatMoney(totalIncome, user.currency),
    formatMoney(totalExpenses, user.currency),
    formatMoney(balance, user.currency)
  ]);

  (doc as any).autoTable({
    startY: 70,
    head: [['Mois', 'Entrées', 'Dépenses', 'Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // Blue-500
  });

  // Net Worth Section if space permits
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.text("Fortune Nette (Situation actuelle)", 14, finalY);
  const bankTotal = yearData.fortune.bankAccounts.reduce((a, b) => a + b.balance, 0);
  const investTotal = yearData.investments.reduce((a, b) => a + b.currentValue, 0);
  const otherAssetsTotal = (yearData.fortune.otherAssets || []).reduce((a, b) => a + b.value, 0);
  
  const totalNetWorth = bankTotal + otherAssetsTotal + investTotal;

  doc.setFontSize(10);
  doc.text(`Comptes Bancaires: ${formatMoney(bankTotal, user.currency)}`, 14, finalY + 10);
  doc.text(`Investissements: ${formatMoney(investTotal, user.currency)}`, 14, finalY + 17);
  doc.text(`Autres Titres: ${formatMoney(otherAssetsTotal, user.currency)}`, 14, finalY + 24);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 100, 0);
  doc.text(`Total: ${formatMoney(totalNetWorth, user.currency)}`, 14, finalY + 35);

  doc.save(`financeflow_${user.name}_${yearData.year}_report.pdf`);
};
