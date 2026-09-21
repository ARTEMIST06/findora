import React from 'react';
import { ShieldCheck, Scale, LineChart, Banknote, Sparkles, CheckCircle2 } from 'lucide-react';

export const WhyFindoraSection: React.FC = () => {
  const benefits = [
    {
      icon: <Scale className="w-6 h-6 text-blue-400" />,
      title: 'Compare Prices Side-by-Side',
      description:
        'Instantly view prices for the exact same model across Amazon, Flipkart, Croma, Reliance Digital, and brand stores without juggling 10 open tabs.',
      border: 'border-blue-500/20',
      glow: 'group-hover:border-blue-500/40',
    },
    {
      icon: <LineChart className="w-6 h-6 text-cyan-400" />,
      title: 'Historical Price Tracking',
      description:
        'Know whether today is truly a discount or an inflated sale trick. We log historic price fluctuations so you buy at the true market low.',
      border: 'border-cyan-500/20',
      glow: 'group-hover:border-cyan-500/40',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      title: 'Unbiased "Why We Picked It"',
      description:
        'Every product includes curated pros, cons, and clear editorial insights. We highlight deal-breakers alongside flagship strengths.',
      border: 'border-purple-500/20',
      glow: 'group-hover:border-purple-500/40',
    },
    {
      icon: <Banknote className="w-6 h-6 text-emerald-400" />,
      title: 'Save Hard-Earned Money',
      description:
        'Shoppers save an average of ₹3,500 to ₹15,000 on consumer electronics, laptops, and premium audio by picking the optimal merchant.',
      border: 'border-emerald-500/20',
      glow: 'group-hover:border-emerald-500/40',
    },
  ];

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>The Findora Advantage</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Why Thousands of Smart Shoppers Choose Findora
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
          We engineered the shopping platform we always wanted for ourselves: fast, clean, multi-store, and free of sponsored clutter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((item, index) => (
          <div
            key={index}
            className={`group relative p-6 bg-[#0D1322]/80 hover:bg-[#121B30] rounded-3xl border border-slate-800/80 ${item.glow} transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl backdrop-blur-sm`}
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#080D1A] shadow-md border border-slate-700/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
