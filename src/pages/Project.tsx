import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, DollarSign, Percent, Calculator } from 'lucide-react';

interface Project {
  id: string;
  client_name: string;
  event_type: string;
  shoot_days: number;
  profit_margin: number;
  tax_percent: number;
}

interface CostItem {
  id: string;
  category: string;
  item_name: string;
  cost_per_unit: number;
  quantity: number;
  subtotal: number;
}

const CATEGORIES = ['Equipment', 'Crew', 'Storage', 'Editing', 'Transport', 'Misc'];

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<CostItem>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ category: 'Equipment', item_name: '', cost_per_unit: 0, quantity: 1 });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const [projectRes, itemsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('cost_items').select('*').eq('project_id', id).order('category')
    ]);

    if (projectRes.data) setProject(projectRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = newItem.cost_per_unit * newItem.quantity;
    const { data, error } = await supabase
      .from('cost_items')
      .insert([{ ...newItem, project_id: id, subtotal }])
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setShowAddItem(false);
      setNewItem({ category: 'Equipment', item_name: '', cost_per_unit: 0, quantity: 1 });
    }
  };

  const handleUpdateItem = async () => {
    if (!editingId) return;
    const subtotal = (editItem.cost_per_unit || 0) * (editItem.quantity || 0);
    const { error } = await supabase
      .from('cost_items')
      .update({ ...editItem, subtotal })
      .eq('id', editingId);

    if (!error) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...editItem, subtotal } as CostItem : item));
      setEditingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Delete this item?')) {
      await supabase.from('cost_items').delete().eq('id', itemId);
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

  const baseTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
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
              <p className="text-sm text-slate-500">{project.event_type}</p>
            </div>
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
                  <input type="number" value={project.tax_percent} onChange={e => handleProjectUpdate('tax_percent', parseFloat(e.target.value))} className="w-20 pl-2 pr-6 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F172A]" />
                  <Percent className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
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
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cost/Unit</label>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="number" min="0" step="0.01" value={newItem.cost_per_unit} onChange={e => setNewItem({...newItem, cost_per_unit: parseFloat(e.target.value)})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qty</label>
                <div className="flex gap-2">
                  <input required type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" />
                  <button type="submit" className="bg-[#FFD600] text-[#0F172A] p-2 rounded-lg hover:bg-yellow-400"><Save className="h-5 w-5" /></button>
                  <button type="button" onClick={() => setShowAddItem(false)} className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200"><X className="h-5 w-5" /></button>
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
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
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
                          <input type="number" value={editItem.cost_per_unit} onChange={e => setEditItem({...editItem, cost_per_unit: parseFloat(e.target.value)})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded text-right" />
                        </td>
                        <td className="py-2 px-4">
                          <input type="number" value={editItem.quantity} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded text-right" />
                        </td>
                        <td className="py-2 px-4 text-right font-medium text-[#0F172A]">${((editItem.cost_per_unit||0) * (editItem.quantity||0)).toFixed(2)}</td>
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
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">${item.cost_per_unit.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm font-bold text-[#0F172A] text-right">${item.subtotal.toFixed(2)}</td>
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center">
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base Cost</div>
              <div className="text-lg font-medium text-slate-700">${baseTotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Profit ({project.profit_margin}%)</div>
              <div className="text-lg font-medium text-green-600">+${profitAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tax ({project.tax_percent}%)</div>
              <div className="text-lg font-medium text-slate-500">+${taxAmount.toFixed(2)}</div>
            </div>
            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-8">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Final Quote</div>
              <div className="text-3xl font-extrabold text-[#0F172A]">${finalPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
