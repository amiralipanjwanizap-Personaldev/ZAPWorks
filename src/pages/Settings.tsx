import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Building, MapPin, Phone, Mail, FileText, Image as ImageIcon } from 'lucide-react';

interface BusinessSettings {
  id: string;
  business_name: string;
  address: string;
  phone: string;
  email: string;
  registration_number: string;
  logo_url: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<BusinessSettings>({
    id: '',
    business_name: '',
    address: '',
    phone: '',
    email: '',
    registration_number: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle to avoid error when no rows found

    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create payload and remove id if it's empty to avoid UUID validation errors
    const payload: any = { ...settings, user_id: user.id };
    if (!payload.id) {
      delete payload.id;
    }

    const { error } = await supabase
      .from('business_settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (!error) {
      alert('Settings saved successfully!');
      // Refresh settings to get the new ID if it was an insert
      fetchSettings();
    } else {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div></div>;

  return (
    <div className="flex-1 bg-[#F8FAFC] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
            <Building className="h-6 w-6" /> Business Settings
          </h1>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400" /> Logo URL
                </label>
                <input 
                  type="url" 
                  value={settings.logo_url || ''} 
                  onChange={e => setSettings({...settings, logo_url: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" 
                  placeholder="https://example.com/logo.png" 
                />
                <p className="text-xs text-slate-500 mt-1">Enter a direct link to your logo image (PNG or JPG recommended).</p>
                {settings.logo_url && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
                    <img src={settings.logo_url} alt="Logo Preview" className="h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate-400" /> Business Name
                </label>
                <input 
                  required 
                  type="text" 
                  value={settings.business_name || ''} 
                  onChange={e => setSettings({...settings, business_name: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" /> Address
                </label>
                <textarea 
                  rows={3}
                  value={settings.address || ''} 
                  onChange={e => setSettings({...settings, address: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" /> Phone
                  </label>
                  <input 
                    type="text" 
                    value={settings.phone || ''} 
                    onChange={e => setSettings({...settings, phone: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" /> Email
                  </label>
                  <input 
                    type="email" 
                    value={settings.email || ''} 
                    onChange={e => setSettings({...settings, email: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" /> Registration Number (Optional)
                </label>
                <input 
                  type="text" 
                  value={settings.registration_number || ''} 
                  onChange={e => setSettings({...settings, registration_number: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent" 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#FFD600] text-[#0F172A] px-6 py-3 rounded-xl text-sm font-bold hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Settings</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
