import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Folder, AlertCircle, FileText, Settings } from 'lucide-react';

interface Project {
  id: string;
  client_name: string;
  event_type: string;
  created_at: string;
  base_currency: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ 
    client_name: '', 
    event_type: '', 
    shoot_days: 1, 
    profit_margin: 20, 
    tax_percent: 10,
    base_currency: 'USD',
    template_id: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const [projectsRes, subRes, templatesRes, currenciesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
      supabase.from('cost_templates').select('*').eq('user_id', user.id),
      supabase.from('currencies').select('*')
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (subRes.data) setSubscription(subRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (currenciesRes.data && currenciesRes.data.length > 0) {
      setCurrencies(currenciesRes.data);
      setNewProject(prev => ({ ...prev, base_currency: currenciesRes.data[0].code || 'USD' }));
    } else {
      setCurrencies([{ code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'TZS', name: 'Tanzanian Shilling' }]);
    }
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (subscription?.plan === 'free' && projects.length >= 3) {
      alert('Free plan limit reached. Please upgrade to Pro.');
      navigate('/pricing');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { template_id, ...projectData } = newProject;

    // 1. Create Project
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{ ...projectData, user_id: user.id }])
      .select()
      .single();

    if (error || !project) {
      console.error('Error creating project:', error);
      return;
    }

    // 2. Duplicate Template Items if a template was selected
    if (template_id) {
      const { data: templateItems } = await supabase
        .from('template_items')
        .select('*')
        .eq('template_id', template_id);

      if (templateItems && templateItems.length > 0) {
        const projectDate = new Date().toISOString().split('T')[0];
        
        const costItemsToInsert = await Promise.all(templateItems.map(async (item) => {
          const rate = await getExchangeRate(item.currency || 'USD', project.base_currency, projectDate);
          const quantity = item.default_quantity || 1;
          const days = 1; // Default days
          const costPerUnit = item.default_rate || 0;
          const originalAmount = quantity * days * costPerUnit;
          const convertedAmount = originalAmount * rate;

          return {
            project_id: project.id,
            category: item.category,
            item_name: item.item_name,
            cost_per_unit: costPerUnit,
            quantity: quantity,
            days: days,
            original_currency: item.currency || 'USD',
            exchange_rate_used: rate,
            converted_subtotal: convertedAmount,
            rate_date: projectDate
          };
        }));

        await supabase.from('project_cost_items').insert(costItemsToInsert);
      }
    }

    navigate(`/project/${project.id}`);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      
      if (error) {
        alert('Error deleting project: ' + error.message);
      } else {
        setProjects(projects.filter(p => p.id !== id));
        alert('Project deleted successfully');
      }
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div></div>;

  const isLimitReached = subscription?.plan === 'free' && projects.length >= 3;

  return (
    <div className="flex-1 bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A]">Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/templates" className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
              <FileText className="h-4 w-4" /> Templates
            </Link>
            <Link to="/settings" className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              onClick={() => setShowNewProject(true)}
              disabled={isLimitReached}
              className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>
        </div>

        {isLimitReached && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Free Plan Limit Reached</h3>
              <p className="text-sm text-yellow-700 mt-1">You have reached the limit of 3 projects on the free plan. Upgrade to Pro for unlimited projects.</p>
              <Link to="/pricing" className="text-sm font-bold text-yellow-800 mt-2 inline-block hover:underline">Upgrade Now &rarr;</Link>
            </div>
          </div>
        )}

        {showNewProject && !isLimitReached && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client Name</label>
                <input required type="text" value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Type</label>
                <input required type="text" value={newProject.event_type} onChange={e => setNewProject({...newProject, event_type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" placeholder="e.g. Wedding, Corporate" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base Currency</label>
                <select required value={newProject.base_currency} onChange={e => setNewProject({...newProject, base_currency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A] focus:border-transparent">
                  {currencies.map(c => (
                    <option key={c.code || c.id} value={c.code || c.id}>{c.code || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shoot Days</label>
                <input required type="number" min="1" value={newProject.shoot_days} onChange={e => setNewProject({...newProject, shoot_days: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Profit Margin (%)</label>
                <input required type="number" min="0" value={newProject.profit_margin} onChange={e => setNewProject({...newProject, profit_margin: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cost Template (Optional)</label>
                <select value={newProject.template_id} onChange={e => setNewProject({...newProject, template_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F172A] focus:border-transparent">
                  <option value="">-- No Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowNewProject(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="bg-[#FFD600] text-[#0F172A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400">Create</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project.id} to={`/project/${project.id}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <Folder className="h-6 w-6 text-[#0F172A]" />
                </div>
                <button onClick={(e) => handleDeleteProject(project.id, e)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-1 truncate">{project.client_name}</h3>
              <p className="text-sm text-slate-500 mb-4">{project.event_type}</p>
              <div className="flex justify-between items-center">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {project.base_currency || 'USD'}
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && !showNewProject && (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#0F172A] mb-2">No projects yet</h3>
              <p className="text-slate-500 mb-6">Create your first project to start calculating costs.</p>
              <button onClick={() => setShowNewProject(true)} className="bg-[#0F172A] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
