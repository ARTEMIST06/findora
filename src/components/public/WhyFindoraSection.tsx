import React from 'react';
import { ShieldCheck, Scale, Tag, Banknote } from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const WhyFindoraSection: React.FC = () => {
  // Every claim here is something Findora actually does. No price-history
  // promises, no "every product has pros & cons" — most products do not
  // have curated pros/cons stored, so we do not claim they do.
  const benefits = [
    {
      icon: <Scale className="w-6 h-6 text-blue-600" />,
      title: 'One Verified Price Per Product',
      description:
        'One checked Amazon India price per product, with the date it was last verified — no juggling 10 open tabs.',
      glow: 'group-hover:border-blue-500/40',
    },
    {
      icon: <Tag className="w-6 h-6 text-amber-600" />,
      title: 'Real Discounts, Not Inflated Sales',
      description:
        'The discount shown is the gap between the stored price and its MRP. We never invent a "was" price to make a deal look bigger.',
      glow: 'group-hover:border-amber-500/40',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      title: 'No Sponsored Listings',
      description:
        'Picks are editorial, not paid placements. Links to Amazon earn us a commission at no extra cost to you — see the affiliate disclosure.',
      glow: 'group-hover:border-emerald-500/40',
    },
    {
      icon: <Banknote className="w-6 h-6 text-purple-600" />,
      title: 'Built for India, Built for Budgets',
      description:
        'Prices in ₹, Amazon India only, with budget-friendly picks for students and everyday buyers — from ₹199 essentials to big-ticket appliances.',
      glow: 'group-hover:border-purple-500/40',
    },
  ];

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>The Findora Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Smart Shoppers Choose Findora
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            A clean catalogue, honest prices, and links that actually work — built for shoppers, not for ad slots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, index) => (
            <div
              key={index}
              className={`group relative p-6 bg-white/80 hover:bg-[#121B30] rounded-3xl border border-slate-200/80 ${item.glow} transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl backdrop-blur-sm card-lift`}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#080D1A] shadow-md border border-slate-300/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
};
