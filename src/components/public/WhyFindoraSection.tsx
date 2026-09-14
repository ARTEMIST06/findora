import React from 'react';
import { ShieldCheck, Scale, LineChart, Banknote, Sparkles, CheckCircle2 } from 'lucide-react';

export const WhyFindoraSection: React.FC = () => {
  const benefits = [
    {
      icon: <Scale className="w-6 h-6 text-blue-600" />,
      title: 'Compare Prices Side-by-Side',
      description:
        'Instantly view prices for the exact same model across Amazon, Flipkart, Croma, Reliance Digital, and brand stores without juggling 10 open tabs.',
    },
    {
      icon: <LineChart className="w-6 h-6 text-emerald-600" />,
      title: 'Historical Price Tracking',
      description:
        'Know whether today is truly a discount or an inflated sale trick. We log historic price fluctuations so you buy at the true market low.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
      title: 'Unbiased "Why We Picked It"',
      description:
        'Every product includes curated pros, cons, and clear editorial insights. We highlight deal-breakers alongside flagship strengths.',
    },
    {
      icon: <Banknote className="w-6 h-6 text-amber-600" />,
      title: 'Save Hard-Earned Money',
      description:
        'Shoppers save an average of ₹3,500 to ₹15,000 on consumer electronics, laptops, and premium audio by picking the optimal merchant.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>The Findora Advantage</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Why Thousands of Shoppers Trust Findora First
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-2xl mx-auto">
          We engineered the shopping platform we always wanted for ourselves: fast, clean, multi-store, and free of sponsored clutter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((item, index) => (
          <div
            key={index}
            className="group relative p-6 bg-slate-50/50 rounded-3xl border border-slate-200/60 hover:bg-white hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
            
            {/* Background decorative element */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-slate-200/40 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors duration-500 z-0"></div>
          </div>
        ))}
      </div>
    </section>
  );
};
