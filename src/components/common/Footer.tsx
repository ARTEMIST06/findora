import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useToast } from './Toast';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      showToast('Thank you for subscribing to Findora deal alerts!', 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#05080F] text-slate-400 border-t border-slate-800/80 pt-16 pb-12 mt-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="dark" size="lg" showTagline={true} onClick={() => onNavigate('/')} />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm pt-2">
              Findora is India's premier intelligent product discovery and multi-store price comparison
              engine. We track pricing across Amazon, Flipkart, Croma, Reliance Digital, and top retailers to guarantee you never overpay.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Unbiased Price Tracking • Zero Added Markup</span>
            </div>
          </div>

          {/* Column 1: Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Discovery</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/products')}
                  className="hover:text-blue-400 transition-colors"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/deals')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-amber-400">🔥</span>
                  <span>Trending Deals</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/categories')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/compare')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Compare Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/wishlist')}
                  className="hover:text-rose-400 transition-colors"
                >
                  Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/blog')}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Buying Guides & Blog</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company & Trust</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-blue-400 transition-colors"
                >
                  About Findora
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/affiliate-disclosure')}
                  className="hover:text-blue-400 transition-colors text-blue-400 font-medium"
                >
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/cookie-disclosure')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-indigo-400 transition-colors text-xs text-indigo-400 pt-1 block"
                >
                  Admin Portal →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter Alert */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Price Drop Alerts</h4>
            <p className="text-xs text-slate-400">
              Get notified when flagship smartphones, laptops, and audio gadgets hit their all-time lowest prices.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You are subscribed to Findora alerts!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-[#0D1424] border border-slate-700/80 focus:border-blue-500 rounded-full px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  <span>Subscribe to Alerts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Affiliate Disclosure Compliance Box */}
        <div className="my-8 p-4 sm:p-5 rounded-2xl bg-[#090F1E] border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500"></span>
            <span>Findora Transparent Affiliate Disclosure</span>
          </p>
          Findora is a free, independent product discovery and price comparison platform. When you click on links to merchants (including Amazon India, Flipkart, Croma, Reliance Digital, and others) and make a qualifying purchase, Findora may earn an affiliate commission at zero additional cost to you. Store prices, availability, and promotional coupons are updated continuously by our editorial team and merchant data connectors. All product ratings, benchmarks, and "Why Findora Picked It" analyses represent independent editorial verdicts.
        </div>

        {/* Bottom copyright & attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Findora. Find it. Compare it. Buy smarter.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Multi-Store Price Engine</span>
            <span>•</span>
            <button onClick={() => onNavigate('/affiliate-disclosure')} className="hover:text-slate-300">
              Affiliate Disclosure
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-300">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('/terms')} className="hover:text-slate-300">
              Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
