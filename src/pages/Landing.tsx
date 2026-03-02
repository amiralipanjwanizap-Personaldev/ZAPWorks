import { Link } from 'react-router-dom';
import { Calculator, Smartphone, TrendingUp, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="bg-[#0F172A] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-sm border border-white/20">
            <Zap className="h-4 w-4 text-[#FFD600]" />
            <span className="text-sm font-medium tracking-wide uppercase text-white/90">
              Photography & Videography Cost Calculator
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Precision Pricing. <br />
            <span className="text-[#FFD600]">Instant Results.</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
            Stop guessing your margins. ZAPWorks is the mobile-first SaaS that helps creatives calculate costs, track profit, and price projects with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-[#FFD600] text-[#0F172A] px-8 py-4 rounded-xl text-lg font-bold hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(255,214,0,0.3)] hover:shadow-[0_0_30px_rgba(255,214,0,0.5)] transform hover:-translate-y-1"
            >
              Start Free
            </Link>
            <Link
              to="/pricing"
              className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">Everything you need to price right</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Built specifically for the unique needs of photographers and videographers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#F8FAFC] p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="bg-[#0F172A] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Calculator className="h-6 w-6 text-[#FFD600]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Smart Cost Tracking</h3>
              <p className="text-slate-600 leading-relaxed">Categorize expenses by equipment, crew, editing, and transport. Never miss a hidden cost again.</p>
            </div>
            <div className="bg-[#F8FAFC] p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="bg-[#0F172A] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-[#FFD600]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Real-Time Profit</h3>
              <p className="text-slate-600 leading-relaxed">Set your desired profit margin and tax rate. See your final price update instantly as you add costs.</p>
            </div>
            <div className="bg-[#F8FAFC] p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="bg-[#0F172A] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6 text-[#FFD600]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Mobile Ready (PWA)</h3>
              <p className="text-slate-600 leading-relaxed">Install ZAPWorks on your phone. Calculate quotes on set, in the studio, or meeting with clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-slate-200 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-[#0F172A] border-4 border-[#F8FAFC] shadow-xl mb-6">1</div>
              <h3 className="text-xl font-bold mb-2">Create Project</h3>
              <p className="text-slate-600">Enter client details, shoot days, and target margins.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-[#0F172A] border-4 border-[#F8FAFC] shadow-xl mb-6">2</div>
              <h3 className="text-xl font-bold mb-2">Add Costs</h3>
              <p className="text-slate-600">List equipment, crew, travel, and post-production expenses.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#0F172A] rounded-full flex items-center justify-center text-3xl font-bold text-[#FFD600] border-4 border-[#F8FAFC] shadow-xl mb-6">3</div>
              <h3 className="text-xl font-bold mb-2">Get Final Price</h3>
              <p className="text-slate-600">Instantly see your total cost, profit, tax, and final quote.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F172A] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to price like a pro?</h2>
          <p className="text-xl text-slate-300 mb-10">Join creatives who use ZAPWorks to ensure every project is profitable.</p>
          <Link
            to="/register"
            className="inline-block bg-[#FFD600] text-[#0F172A] px-10 py-5 rounded-xl text-xl font-bold hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(255,214,0,0.3)] transform hover:-translate-y-1"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
