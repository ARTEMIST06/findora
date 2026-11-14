import React from 'react';

// Minimal Blog / Buying Guides page.
// There was no /blog route at all (Navbar + Footer linked to it, App.tsx
// fell through to the in-app 404). This page stops the 404 with honest
// content: it links to the real, existing parts of the site instead of
// inventing blog posts. Full guides are a content task, not a code fix.
export function BlogPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const guides = [
    {
      title: 'Budget earbuds: what to check before you buy',
      text: 'Calls, battery and fit matter more than the discount percentage. Compare the live catalogue first.',
      path: '/products',
    },
    {
      title: 'Power banks: capacity, watts and cables',
      text: '10,000mAh is enough for a day. Check the watt rating and whether the cable is built in.',
      path: '/deals',
    },
    {
      title: 'How Findora picks products',
      text: 'We list one verified Amazon offer per product and say when it was last verified. No multi-store price is shown unless it was actually checked.',
      path: '/about',
    },
    {
      title: 'Earbuds: ENC vs ANC — what the terms actually mean',
      text: 'ENC clears your voice on calls; ANC quiets the world for you. Under ₹1,500, real ANC is rare — read the spec sheet, not the box.',
      path: '/products',
    },
    {
      title: 'Mouse & keyboard for study: wireless vs wired',
      text: '2.4GHz dongles are steadier than Bluetooth for daily use. Silent clicks matter in a hostel or library; check battery life before you buy.',
      path: '/products',
    },
    {
      title: 'Laptop heating? A stand and a cooling pad do different jobs',
      text: 'A stand lifts the laptop for airflow and better posture. A cooling pad adds fans. Clean the vents first — dust is the usual culprit.',
      path: '/products',
    },
    {
      title: 'USB-C cables: watts, braiding and why cheap ones fail',
      text: 'Match the watt rating to your charger — a 60W cable on a 65W charger is fine, a 15W cable is not. Braided cables survive bags far longer.',
      path: '/products',
    },
    {
      title: 'College desk setup under ₹1,000',
      text: 'Spend first on a laptop stand and a mouse, then a cable and a lamp. Skip the RGB extras until the basics are covered.',
      path: '/categories',
    },
    {
      title: 'How to spot a fake discount on Amazon',
      text: 'Compare the deal price with the MRP and the price history, not with a struck-through number. A "deal of the day" is not always a deal.',
      path: '/deals',
    },
    {
      title: 'Power bank safety: certifications and charging habits',
      text: 'Look for BIS/ISI certification and overcharge protection. Avoid no-name brands, and do not leave a power bank charging overnight unattended.',
      path: '/deals',
    },
  ];
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Buying Guides &amp; Blog</h1>
      <p className="text-slate-600 mb-8">
        Short, honest buying guides. New guides are added as the catalogue grows — nothing here is
        auto-generated filler.
      </p>
      <div className="grid gap-4">
        {guides.map((g) => (
          <button
            key={g.title}
            onClick={() => onNavigate(g.path)}
            className="text-left p-5 rounded-2xl bg-slate-900/[0.03] border border-slate-200 hover:border-indigo-400/50 transition-colors"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-1">{g.title}</h2>
            <p className="text-sm text-slate-600">{g.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
