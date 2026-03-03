import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, DollarSign, Percent, Calculator, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Project {
  id: string;
  client_name: string;
  event_type: string;
  shoot_days: number;
  profit_margin: number;
  tax_percent: number;
  base_currency: string;
  created_at: string;
}

interface CostItem {
  id: string;
  category: string;
  item_name: string;
  cost_per_unit: number;
  quantity: number;
  days: number;
  original_currency: string;
  exchange_rate_used: number;
  converted_subtotal: number;
  rate_date: string;
}

const CATEGORIES = ['Equipment', 'Crew', 'Storage', 'Editing', 'Transport', 'Misc'];

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<CostItem[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<CostItem>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ 
    category: 'Equipment', 
    item_name: '', 
    cost_per_unit: 0, 
    quantity: 1, 
    days: 1,
    original_currency: 'USD'
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const [projectRes, itemsRes, currenciesRes, settingsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_cost_items').select('*').eq('project_id', id).order('category'),
      supabase.from('currencies').select('*'),
      supabase.from('business_settings').select('*').eq('user_id', user.id).single()
    ]);

    if (projectRes.data) {
      setProject(projectRes.data);
      setNewItem(prev => ({ ...prev, original_currency: projectRes.data.base_currency || 'USD' }));
    }
    if (itemsRes.data) setItems(itemsRes.data);
    if (currenciesRes.data && currenciesRes.data.length > 0) {
      setCurrencies(currenciesRes.data);
    } else {
      setCurrencies([{ code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'TZS', name: 'Tanzanian Shilling' }]);
    }
    if (settingsRes.data) setBusinessSettings(settingsRes.data);
    setLoading(false);
  };

  const getExchangeRate = async (fromCurrency: string, toCurrency: string, date: string) => {
    if (fromCurrency === toCurrency) return 1.0;
    
    const { data } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .lte('rate_date', date)
      .order('rate_date', { ascending: false })
      .limit(1)
      .single();
      
    if (data) return data.rate;
    return 1.0; // Fallback
  };

  const handleDownloadPDF = () => {
    if (!project) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Colors
    const primaryColor = '#0F172A'; // Dark Slate
    const secondaryColor = '#64748B'; // Slate 500
    const lineColor = '#E2E8F0'; // Slate 200

    // --- 1. Header Section ---
    let currentY = 20;

    // Logo (Left)
    if (businessSettings?.logo_url) {
      try {
        const img = new Image();
        img.src = businessSettings.logo_url;
        doc.addImage(img, 'PNG', margin, currentY, 25, 25);
      } catch (e) {
        console.error('Error adding logo', e);
      }
    }

    // Company Details (Left, under logo)
    const logoHeight = businessSettings?.logo_url ? 30 : 0;
    let headerTextY = currentY + logoHeight + (businessSettings?.logo_url ? 5 : 0);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor);
    doc.text(businessSettings?.business_name || 'Company Name', margin, headerTextY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor);
    headerTextY += 6;
    
    const details = [
      businessSettings?.address,
      businessSettings?.phone ? `Phone: ${businessSettings.phone}` : '',
      businessSettings?.email ? `Email: ${businessSettings.email}` : '',
      businessSettings?.registration_number ? `Reg: ${businessSettings.registration_number}` : ''
    ].filter(Boolean);

    details.forEach(detail => {
      doc.text(detail, margin, headerTextY);
      headerTextY += 5;
    });

    // Right Column (Title & Meta)
    const rightColX = pageWidth - margin;
    let metaY = 20;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.text('QUOTATION', rightColX, metaY, { align: 'right' });
    
    metaY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    
    const quoteNum = `Q-${project.id.substring(0, 8).toUpperCase()}`;
    doc.text(`Quote #: ${quoteNum}`, rightColX, metaY, { align: 'right' });
    metaY += 5;
    
    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${issueDate}`, rightColX, metaY, { align: 'right' });
    
    // Separation Line
    const lineY = Math.max(headerTextY, metaY) + 5;
    doc.setDrawColor(lineColor);
    doc.setLineWidth(0.5);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    // --- 2. Client Information Block ---
    currentY = lineY + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('BILL TO:', margin, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text(project.client_name, margin, currentY);
    
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text(project.event_type, margin, currentY);

    // --- 3. Item Table ---
    currentY += 15;
    
    const tableHeaders = [['Description', 'Category', 'Qty', 'Days', 'Rate', 'Amount']];
    
    const tableData = items.map(item => [
      item.item_name,
      item.category,
      item.quantity.toString(),
      item.days.toString(),
      `${item.original_currency} ${item.cost_per_unit.toFixed(2)}`,
      `${project.base_currency} ${item.converted_subtotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: tableData,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        lineColor: lineColor,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: '#F8FAFC',
        textColor: primaryColor,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 30, halign: 'left' },
        2: { cellWidth: 15, halign: 'right' },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    // --- 4. Totals Section ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsX = pageWidth - margin;
    
    const baseTotal = items.reduce((sum, item) => sum + item.converted_subtotal, 0);
    const profitAmount = baseTotal * (project.profit_margin / 100);
    const taxAmount = (baseTotal + profitAmount) * (project.tax_percent / 100);
    const finalPrice = baseTotal + profitAmount + taxAmount;

    let totalsY = finalY;
    const lineHeight = 6;

    const addTotalLine = (label: string, value: string, isBold = false, isLarge = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(isLarge ? 12 : 10);
      doc.setTextColor(isBold ? primaryColor : secondaryColor);
      doc.text(label, totalsX - 40, totalsY, { align: 'right' });
      doc.text(value, totalsX, totalsY, { align: 'right' });
      totalsY += lineHeight;
    };

    addTotalLine('Subtotal:', `${project.base_currency} ${baseTotal.toFixed(2)}`);
    if (profitAmount > 0) {
        addTotalLine(`Margin (${project.profit_margin}%):`, `${project.base_currency} ${profitAmount.toFixed(2)}`);
    }
    if (taxAmount > 0) {
        addTotalLine(`Tax (${project.tax_percent}%):`, `${project.base_currency} ${taxAmount.toFixed(2)}`);
    }
    
    totalsY += 2;
    addTotalLine('Total:', `${project.base_currency} ${finalPrice.toFixed(2)}`, true, true);

    // --- 5. Footer ---
    let footerY = Math.max(totalsY + 20, pageHeight - 30);
    
    doc.setDrawColor(lineColor);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    footerY += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor);
    doc.text('Terms & Conditions', margin, footerY);
    
    footerY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text('Payment is due within 30 days. Please include quote number on invoice.', margin, footerY);
    
    footerY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor);
    doc.text('Thank you for your business!', margin, footerY);

    doc.save(`${project.client_name.replace(/\s+/g, '_')}_Quote.pdf`);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const projectDate = project.created_at.split('T')[0];
    const rate = await getExchangeRate(newItem.original_currency, project.base_currency, projectDate);
    
    const originalAmount = newItem.cost_per_unit * newItem.quantity * newItem.days;
    const convertedAmount = originalAmount * rate;

    const itemToInsert = {
      ...newItem,
      project_id: id,
      exchange_rate_used: rate,
      converted_subtotal: convertedAmount,
      rate_date: projectDate
    };

    const { data, error } = await supabase
      .from('project_cost_items')
      .insert([itemToInsert])
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setShowAddItem(false);
      setNewItem({ 
        category: 'Equipment', 
        item_name: '', 
        cost_per_unit: 0, 
        quantity: 1, 
        days: 1,
        original_currency: project.base_currency || 'USD'
      });
    }
  };

  const handleUpdateItem = async () => {
    if (!editingId || !project) return;
    
    const projectDate = project.created_at.split('T')[0];
    const rate = await getExchangeRate(editItem.original_currency || 'USD', project.base_currency, projectDate);
    
    const costPerUnit = editItem.cost_per_unit || 0;
    const quantity = editItem.quantity || 0;
    const days = editItem.days || 1;
    
    const originalAmount = costPerUnit * quantity * days;
    const convertedAmount = originalAmount * rate;

    const updateData = {
      ...editItem,
      exchange_rate_used: rate,
      converted_subtotal: convertedAmount,
      rate_date: projectDate
    };

    const { error } = await supabase
      .from('project_cost_items')
      .update(updateData)
      .eq('id', editingId);

    if (!error) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...updateData } as CostItem : item));
      setEditingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Delete this item?')) {
      await supabase.from('project_cost_items').delete().eq('id', itemId);
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const handleProjectUpdate = async (field: keyof Project, value: any) => {
    if (!project) return;
    const updated = { ...project, [field]: value };
    setProject(updated);
    await supabase.from('projects').update({ [field]: value }).eq('id', project.id);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div></div>;
  if (!project) return <div className="flex-1 flex items-center justify-center text-slate-500">Project not found</div>;

  const baseTotal = items.reduce((sum, item) => sum + item.converted_subtotal, 0);
  const profitAmount = baseTotal * (project.profit_margin / 100);
  const taxAmount = (baseTotal + profitAmount) * (project.tax_percent / 100);
  const finalPrice = baseTotal + profitAmount + taxAmount;

  return (
    <div className="flex-1 bg-[#F8FAFC] pb-32 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">{project.client_name}</h1>
              <p className="text-sm text-slate-500">{project.event_type} &bull; Base Currency: {project.base_currency}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleDownloadPDF} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margin</label>
                  <div className="relative">
                    <input type="number" value={project.profit_margin} onChange={e => handleProjectUpdate('profit_margin', parseFloat(e.target.value))} className="w-20 pl-2 pr-6 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F172A]" />
                    <Percent className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax</label>
                  <div className="relative">
                    <input type="number" value={project.tax_percent} onChange={e => handleProjectUpdate('tax_percent', parseFloat(e.target.value))} className="w-full pl-2 pr-6 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F172A]" />
                    <Percent className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#0F172A]">Cost Items</h2>
          <button onClick={() => setShowAddItem(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Cost
          </button>
        </div>

        {showAddItem && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name</label>
                <input required type="text" value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" placeholder="e.g. Sony A7SIII" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
                <select value={newItem.original_currency} onChange={e => setNewItem({...newItem, original_currency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]">
                  {currencies.map(c => <option key={c.code || c.id} value={c.code || c.id}>{c.code || c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cost/Unit</label>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="number" min="0" step="0.01" value={newItem.cost_per_unit} onChange={e => setNewItem({...newItem, cost_per_unit: parseFloat(e.target.value)})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qty & Days</label>
                <div className="flex gap-2">
                  <input required type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" title="Quantity" />
                  <input required type="number" min="1" value={newItem.days} onChange={e => setNewItem({...newItem, days: parseInt(e.target.value)})} className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" title="Days" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">&nbsp;</label>
                <div className="flex gap-2">
                  <button type="submit" className="bg-[#FFD600] text-[#0F172A] p-2 rounded-lg hover:bg-yellow-400 w-full flex justify-center"><Save className="h-5 w-5" /></button>
                  <button type="button" onClick={() => setShowAddItem(false)} className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 w-full flex justify-center"><X className="h-5 w-5" /></button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cost</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qty/Days</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Subtotal ({project.base_currency})</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">No items added yet.</td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === item.id ? (
                      <>
                        <td className="py-2 px-4">
                          <select value={editItem.category} onChange={e => setEditItem({...editItem, category: e.target.value})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-4">
                          <input type="text" value={editItem.item_name} onChange={e => setEditItem({...editItem, item_name: e.target.value})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-1">
                            <select value={editItem.original_currency} onChange={e => setEditItem({...editItem, original_currency: e.target.value})} className="w-16 px-1 py-1 text-xs border border-slate-300 rounded">
                              {currencies.map(c => <option key={c.code || c.id} value={c.code || c.id}>{c.code || c.name}</option>)}
                            </select>
                            <input type="number" value={editItem.cost_per_unit} onChange={e => setEditItem({...editItem, cost_per_unit: parseFloat(e.target.value)})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded text-right" />
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-1">
                            <input type="number" value={editItem.quantity} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} className="w-12 px-1 py-1 text-sm border border-slate-300 rounded text-right" title="Qty" />
                            <span className="text-slate-400 self-center">x</span>
                            <input type="number" value={editItem.days} onChange={e => setEditItem({...editItem, days: parseInt(e.target.value)})} className="w-12 px-1 py-1 text-sm border border-slate-300 rounded text-right" title="Days" />
                          </div>
                        </td>
                        <td className="py-2 px-4 text-right font-medium text-[#0F172A]">
                          {project.base_currency} {((editItem.cost_per_unit||0) * (editItem.quantity||0) * (editItem.days||1) * (editItem.exchange_rate_used||1)).toFixed(2)}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={handleUpdateItem} className="text-green-600 hover:text-green-800 p-1"><Save className="h-4 w-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-sm text-slate-500">{item.category}</td>
                        <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">{item.item_name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">
                          {item.original_currency} {item.cost_per_unit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.quantity} &times; {item.days}d</td>
                        <td className="py-3 px-4 text-sm font-bold text-[#0F172A] text-right">
                          {project.base_currency} {item.converted_subtotal.toFixed(2)}
                          {item.exchange_rate_used !== 1 && (
                            <div className="text-[10px] text-slate-400 font-normal">Rate: {item.exchange_rate_used}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{opacity: 1}}>
                            <button onClick={() => { setEditingId(item.id); setEditItem(item); }} className="text-slate-400 hover:text-[#0F172A] p-1"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Summary / Desktop Sidebar equivalent */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:sticky md:bottom-auto md:max-w-7xl md:mx-auto md:rounded-t-2xl md:border-x md:border-slate-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <Calculator className="h-4 w-4 text-[#FFD600]" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary ({project.base_currency})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center">
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base Cost</div>
              <div className="text-lg font-medium text-slate-700">{baseTotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Profit ({project.profit_margin}%)</div>
              <div className="text-lg font-medium text-green-600">+{profitAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tax ({project.tax_percent}%)</div>
              <div className="text-lg font-medium text-slate-500">+{taxAmount.toFixed(2)}</div>
            </div>
            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-8">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Final Quote</div>
              <div className="text-3xl font-extrabold text-[#0F172A]">{finalPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
