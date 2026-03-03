import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, ArrowLeft, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('cost_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching templates:', error);
    if (data) setTemplates(data);
    setLoading(false);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this template?')) {
      const { error } = await supabase.from('cost_templates').delete().eq('id', id);
      
      if (error) {
        alert('Error deleting template: ' + error.message);
      } else {
        setTemplates(templates.filter(t => t.id !== id));
        alert('Template deleted successfully');
      }
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div></div>;

  return (
    <div className="flex-1 bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A]">Cost Templates</h1>
          <Link to="/templates/new" className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <FileText className="h-6 w-6 text-[#0F172A]" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/templates/${template.id}`} className="text-slate-400 hover:text-[#0F172A] p-1">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button onClick={(e) => handleDeleteTemplate(template.id, e)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-1 truncate">{template.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{template.description || 'No description'}</p>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Created {new Date(template.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#0F172A] mb-2">No templates yet</h3>
              <p className="text-slate-500 mb-6">Create a template to speed up project creation.</p>
              <Link to="/templates/new" className="bg-[#0F172A] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Template
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
