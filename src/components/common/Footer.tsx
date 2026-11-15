import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useToast } from './Toast';
import { useFindoraStore } from '../../services/store';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { showToast } = useToast();
  const store = useFindoraStore();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || subscribing) return;
    setSubscribing(true);
    // Saved for real in Firestore (store.subscribeNewsletter). If the write
    // fails, say so — the old version showed "subscribed" while saving
    // nothing anywhere.
    const ok = await store.subscribeNewsletter(email);
    setSubscribing(false);
    if (ok) {
      setSubscribed(true);
      showToast('Thank you for subscribing to Findora deal alerts!', 'success');
      setEmail('');
    } else {
      showToast("Couldn't save your email right now — please try again.", 'error');
    }
  };

  return (
    <footer className="bg-black text-white/70 border-t border-black pt-10 sm:pt-16 pb-0 mt-8 relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" size="lg" showTagline={true} onClick={() => onNavigate('/')} />
            <p className="text-sm text-white/60 leading-relaxed max-w-sm pt-2">
              Findora is an independent product discovery platform. We list one verified Amazon India
              offer per product and show when it was last checked, so you know what you are paying for.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-white/80">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
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
                  className="hover:text-white transition-colors"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/deals')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Trending Deals</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/categories')}
                  className="hover:text-white transition-colors"
                >
                  Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/compare')}
                  className="hover:text-white transition-colors"
                >
                  Compare Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/wishlist')}
                  className="hover:text-white transition-colors"
                >
                  Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/blog')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-white" />
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
                  className="hover:text-white transition-colors"
                >
                  About Findora
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/affiliate-disclosure')}
                  className="hover:text-white transition-colors text-white font-medium"
                >
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/cookie-disclosure')}
                  className="hover:text-white transition-colors"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-white transition-colors text-xs text-white/50 pt-1 block"
                >
                  Admin Portal →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter Alert */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Price Drop Alerts</h4>
            <p className="text-xs text-white/60">
              Get notified when products across tech, home, fashion and more hit their lowest recorded prices.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-white bg-white/10 border border-white/20 p-3 rounded-none">
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
                    className="w-full bg-white/10 border border-white/20 focus:border-white rounded-none px-4 py-2.5 text-xs text-white placeholder-white/40 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-200 text-black rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                >
                  <span>{subscribing ? 'Subscribing…' : 'Subscribe to Alerts'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Affiliate Disclosure Compliance Box */}
        <div className="my-8 p-4 sm:p-5 rounded-none bg-white/5 border border-white/10 text-xs text-white/60 leading-relaxed">
          <p className="font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            <span>Findora Transparent Affiliate Disclosure</span>
          </p>
          Findora is a free, independent product discovery platform. When you click on links to Amazon India and make a qualifying purchase, Findora may earn an affiliate commission at zero additional cost to you. Prices and availability are checked by our editorial team and shown with their last-verified date. All product ratings, benchmarks, and "Why Findora Picked It" analyses represent independent editorial verdicts.
        </div>

        {/* Bottom copyright & attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Findora. Find it. Compare it. Buy smarter.</p>
          <div className="flex items-center gap-4">
            <span className="text-white/50">Verified Amazon Deals</span>
            <span>•</span>
            <button onClick={() => onNavigate('/affiliate-disclosure')} className="hover:text-white">
              Affiliate Disclosure
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('/privacy')} className="hover:text-white">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('/terms')} className="hover:text-white">
              Terms
            </button>
          </div>
        </div>
      </div>

      {/* Giant repeating tagline marquee — Findora's own words, twice for a
          seamless loop (the track translates -50% and repeats). */}
      <div className="mt-10 sm:mt-14 border-t border-white/10 overflow-hidden py-4 sm:py-6" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-marquee w-max">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex items-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="flex items-center">
                  <span className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-white px-4 sm:px-6">
                    Find it. Compare it. Buy smarter.
                  </span>
                  <span className="text-4xl sm:text-6xl font-extrabold text-white/30">•</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
};
