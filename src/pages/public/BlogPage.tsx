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
  ];
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-white mb-2">Buying Guides &amp; Blog</h1>
      <p className="text-slate-400 mb-8">
        Short, honest buying guides. New guides are added as the catalogue grows — nothing here is
        auto-generated filler.
      </p>
      <div className="grid gap-4">
        {guides.map((g) => (
          <button
            key={g.title}
            onClick={() => onNavigate(g.path)}
            className="text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/50 transition-colors"
          >
            <h2 className="text-lg font-bold text-white mb-1">{g.title}</h2>
            <p className="text-sm text-slate-400">{g.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
