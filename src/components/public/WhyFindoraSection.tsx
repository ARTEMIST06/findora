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
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>The Findora Advantage</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Why Thousands of Shoppers Trust Findora First
        </h2>
        <p className="text-slate-600 text-base sm:text-lg mt-3">
          We engineered the shopping platform we always wanted for ourselves: fast, clean, multi-store, and free of sponsored clutter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((item, index) => (
          <div
            key={index}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Verified & Active</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
