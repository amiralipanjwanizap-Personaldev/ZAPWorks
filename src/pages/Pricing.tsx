import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Zap } from 'lucide-react';

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleSubscribe = async (plan: string) => {
    if (!session) {
      navigate('/register');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      
      // Placeholder: Update subscription directly for demo purposes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('subscriptions').update({ plan }).eq('user_id', user.id);
      }
      
      if (data.url) {
        navigate(data.url);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. Upgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Free</h2>
              <p className="text-slate-500">Perfect for getting started</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-[#0F172A]">$0</span>
              <span className="text-slate-500 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600">Up to 3 projects</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600">Basic calculations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600">Mobile PWA access</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('free')}
              disabled={loading}
              className="w-full py-4 rounded-xl text-lg font-bold border-2 border-[#0F172A] text-[#0F172A] hover:bg-slate-50 transition-colors"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#0F172A] rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-[#FFD600] text-[#0F172A] text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1">
                <Zap className="h-3 w-3" /> Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
              <p className="text-slate-400">For professional creatives</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-white">$15</span>
              <span className="text-slate-400 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#FFD600] shrink-0 mt-0.5" />
                <span className="text-slate-300">Unlimited projects</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#FFD600] shrink-0 mt-0.5" />
                <span className="text-slate-300">Advanced analytics (Coming soon)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#FFD600] shrink-0 mt-0.5" />
                <span className="text-slate-300">PDF export (Coming soon)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#FFD600] shrink-0 mt-0.5" />
                <span className="text-slate-300">Priority support</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading}
              className="w-full py-4 rounded-xl text-lg font-bold bg-[#FFD600] text-[#0F172A] hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(255,214,0,0.2)]"
            >
              {loading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
