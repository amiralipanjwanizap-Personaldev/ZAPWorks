import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, DollarSign } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface TemplateItem {
  id: string;
  category: string;
  item_name: string;
  default_quantity: number;
  default_rate: number;
  currency: string;
}

const CATEGORIES = ['Equipment', 'Crew', 'Storage', 'Editing', 'Transport', 'Misc'];

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<TemplateItem>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ 
    category: 'Equipment', 
    item_name: '', 
    default_rate: 0, 
    default_quantity: 1, 
    currency: 'USD'
  });
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      setIsNew(true);
      setTemplate({ id: '', name: 'New Template', description: '' });
      setLoading(false);
      fetchCurrencies();
    } else {
      fetchData();
    }
  }, [id]);

  const fetchCurrencies = async () => {
    const { data } = await supabase.from('currencies').select('*');
    if (data && data.length > 0) {
      setCurrencies(data);
      setNewItem(prev => ({ ...prev, currency: data[0].code || 'USD' }));
    } else {
      setCurrencies([{ code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'TZS', name: 'Tanzanian Shilling' }]);
    }
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const [templateRes, itemsRes, currenciesRes] = await Promise.all([
      supabase.from('cost_templates').select('*').eq('id', id).single(),
      supabase.from('template_items').select('*').eq('template_id', id).order('category'),
      supabase.from('currencies').select('*')
    ]);

    if (templateRes.data) setTemplate(templateRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    if (currenciesRes.data && currenciesRes.data.length > 0) {
      setCurrencies(currenciesRes.data);
    } else {
      setCurrencies([{ code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'TZS', name: 'Tanzanian Shilling' }]);
    }
    setLoading(false);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // Prevent duplicate clicks
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !template) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('cost_templates')
      .insert([{ name: template.name, description: template.description, user_id: user.id }])
      .select()
      .single();

    if (error) {
      alert('Error creating template: ' + error.message);
      setSaving(false);
      return;
    }

    if (data) {
      alert('Template created successfully');
      navigate('/templates'); // Go back to list as requested "refresh template list"
    }
  };

  const handleUpdateTemplate = async (field: keyof Template, value: any) => {
    if (!template) return;
    setTemplate({ ...template, [field]: value });
    if (!isNew) {
      await supabase.from('cost_templates').update({ [field]: value }).eq('id', template.id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      alert('Please save the template first before adding items.');
      return;
    }
    if (!template) return;

    const { data, error } = await supabase
      .from('template_items')
      .insert([{ ...newItem, template_id: template.id }])
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setShowAddItem(false);
      setNewItem({ 
        category: 'Equipment', 
        item_name: '', 
        default_rate: 0, 
        default_quantity: 1, 
        currency: currencies[0]?.code || 'USD'
      });
    }
  };

  const handleUpdateItem = async () => {
    if (!editingId) return;
    
    const { error } = await supabase
      .from('template_items')
      .update(editItem)
      .eq('id', editingId);

    if (!error) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...editItem } as TemplateItem : item));
      setEditingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Delete this item?')) {
      await supabase.from('template_items').delete().eq('id', itemId);
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div></div>;
  if (!template) return <div className="flex-1 flex items-center justify-center text-slate-500">Template not found</div>;

  return (
    <div className="flex-1 bg-[#F8FAFC] pb-32 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/templates')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Templates
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          {isNew ? (
            <form onSubmit={handleCreateTemplate}>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Create New Template</h1>
              <div className="grid gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Template Name</label>
                  <input required type="text" value={template.name} onChange={e => setTemplate({...template, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" placeholder="e.g. Wedding Package" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea value={template.description} onChange={e => setTemplate({...template, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" placeholder="Optional description" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="bg-[#FFD600] text-[#0F172A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Template Name</label>
                <input type="text" value={template.name} onChange={e => handleUpdateTemplate('name', e.target.value)} className="text-2xl font-bold text-[#0F172A] w-full border-none focus:ring-0 p-0 bg-transparent placeholder-slate-300" />
                <input type="text" value={template.description || ''} onChange={e => handleUpdateTemplate('description', e.target.value)} className="text-sm text-slate-500 w-full border-none focus:ring-0 p-0 bg-transparent mt-1 placeholder-slate-300" placeholder="Add description..." />
              </div>
            </div>
          )}
        </div>

        {!isNew && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">Template Items</h2>
              <button onClick={() => setShowAddItem(true)} className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            {showAddItem && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                    <select value={newItem.currency} onChange={e => setNewItem({...newItem, currency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]">
                      {currencies.map(c => <option key={c.code || c.id} value={c.code || c.id}>{c.code || c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Default Rate</label>
                    <div className="relative">
                      <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required type="number" min="0" step="0.01" value={newItem.default_rate} onChange={e => setNewItem({...newItem, default_rate: parseFloat(e.target.value)})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Default Qty</label>
                    <div className="flex gap-2">
                      <input required type="number" min="1" value={newItem.default_quantity} onChange={e => setNewItem({...newItem, default_quantity: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A]" />
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
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Default Rate</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Default Qty</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No items added yet.</td>
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
                                <select value={editItem.currency} onChange={e => setEditItem({...editItem, currency: e.target.value})} className="w-16 px-1 py-1 text-xs border border-slate-300 rounded">
                                  {currencies.map(c => <option key={c.code || c.id} value={c.code || c.id}>{c.code || c.name}</option>)}
                                </select>
                                <input type="number" value={editItem.default_rate} onChange={e => setEditItem({...editItem, default_rate: parseFloat(e.target.value)})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded text-right" />
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <input type="number" value={editItem.default_quantity} onChange={e => setEditItem({...editItem, default_quantity: parseInt(e.target.value)})} className="w-full px-2 py-1 text-sm border border-slate-300 rounded text-right" />
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
                              {item.currency} {item.default_rate.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.default_quantity}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
