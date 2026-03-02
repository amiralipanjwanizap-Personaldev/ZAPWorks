import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Menu, X, Zap } from 'lucide-react';

export default function Layout() {
  const [session, setSession] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0B1120] font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-[#0F172A] p-1.5 rounded-lg">
                  <Zap className="h-5 w-5 text-[#FFD600]" />
                </div>
                <span className="text-xl tracking-tight">
                  <span className="font-bold">ZAP</span>
                  <span className="font-medium">Works</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-[#0F172A]">
                Pricing
              </Link>
              {session ? (
                <>
                  <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-[#0F172A]">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0F172A]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#0F172A]">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-[#0F172A] p-2"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/pricing"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#0F172A] hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              {session ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#0F172A] hover:bg-slate-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#0F172A] hover:bg-slate-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#0F172A] hover:bg-slate-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-[#0F172A] hover:bg-slate-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <div className="bg-[#0F172A] p-1 rounded">
              <Zap className="h-3 w-3 text-[#FFD600]" />
            </div>
            <span className="text-sm font-medium text-slate-600">
              <span className="font-bold">ZAP</span>Works
            </span>
          </div>
          <p className="text-sm text-slate-500">
            powered by ZAPTech +255677855112 Tanzania
          </p>
        </div>
      </footer>
    </div>
  );
}
