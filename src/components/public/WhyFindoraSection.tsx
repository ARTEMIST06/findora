import React from 'react';
import { ShieldCheck, Scale, Tag, Banknote } from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const WhyFindoraSection: React.FC = () => {
  // Every claim here is something Findora actually does. No price-history
  // promises, no "every product has pros & cons" — most products do not
  // have curated pros/cons stored, so we do not claim they do.
  const benefits = [
    {
      icon: <Scale className="w-6 h-6 text-black" />,
      title: 'One Verified Price Per Product',
      description:
        'One checked Amazon India price per product, with the date it was last verified — no juggling 10 open tabs.',
      glow: 'group-hover:border-black',
    },
    {
      icon: <Tag className="w-6 h-6 text-black" />,
      title: 'Real Discounts, Not Inflated Sales',
      description:
        'The discount shown is the gap between the stored price and its MRP. We never invent a "was" price to make a deal look bigger.',
      glow: 'group-hover:border-black',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-black" />,
      title: 'No Sponsored Listings',
      description:
        'Picks are editorial, not paid placements. Links to Amazon earn us a commission at no extra cost to you — see the affiliate disclosure.',
      glow: 'group-hover:border-black',
    },
    {
      icon: <Banknote className="w-6 h-6 text-black" />,
      title: 'Built for India, Built for Budgets',
      description:
        'Prices in ₹, Amazon India only, with budget-friendly picks for students and everyday buyers — from ₹199 essentials to big-ticket appliances.',
      glow: 'group-hover:border-black',
    },
  ];

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="text-left max-w-3xl mb-6 sm:mb-10">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            The Findora Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-black tracking-tight">
            Why Smart Shoppers Choose Findora
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            A clean catalogue, honest prices, and links that actually work — built for shoppers, not for ad slots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, index) => (
            <div
              key={index}
              className={`group relative p-5 sm:p-6 bg-white rounded-none border border-slate-200 ${item.glow} transition-all duration-300 flex flex-col justify-between overflow-hidden card-lift`}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold uppercase text-black mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
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
