import React, { useMemo } from 'react';
import { Scale, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useFindoraStore } from '../../services/store';
import { getProductImage, handleImageFallback } from '../../utils/visualAssets';
import { deriveCategories, normalizeCategoryKey } from '../../utils/categories';
import { Reveal } from '../common/Reveal';

interface ComparisonHighlightProps {
  onNavigate: (route: string) => void;
}

export const ComparisonHighlight: React.FC<ComparisonHighlightProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(true);

  // Real head-to-head: the two highest-priced products from the biggest
  // category in the live catalogue. No invented "Editor's Choice" labels —
  // a badge is shown only if the product actually has one stored.
  const pair = useMemo(() => {
    if (products.length < 2) return null;
    const cats = deriveCategories(products);
    const top = cats[0];
    const inTop = products.filter(
      (p) => normalizeCategoryKey(p.category) === top.key && (p.lowestPrice || 0) > 0
    );
    const pool = inTop.length >= 2 ? inTop : products.filter((p) => (p.lowestPrice || 0) > 0);
    const sorted = [...pool].sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0));
    if (sorted.length < 2) return null;
    return { categoryName: inTop.length >= 2 ? top.name : 'Top picks', p1: sorted[0], p2: sorted[1] };
  }, [products]);

  if (!pair) return null;
  const { p1, p2, categoryName } = pair;

  return (
    <section className="py-6 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 relative">
      <Reveal>
        {/* Compact on phones: tighter panel, one-line header, descriptions
            hidden — the two product cards still show, desktop unchanged. */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 sm:mb-10 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                <Scale className="w-4 h-4 text-cyan-600" />
                <span>Head-to-Head · {categoryName}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Compare Top Picks Side-by-Side
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl">
                Two of the priciest picks in our biggest category, with their verified Amazon India prices. Open the comparison tool to line up any products you like.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/compare')}
              className="btn-primary px-6 py-3 text-xs sm:text-sm shrink-0"
            >
              <span>Launch Comparison Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {[p1, p2].map((p) => (
              <div
                key={p.id}
                className="p-4 sm:p-6 rounded-2xl bg-white/80 border border-slate-200/90 backdrop-blur-md flex flex-col justify-between hover:border-blue-500/40 transition-all duration-300 group card-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                      {p.brand}
                    </span>
                    {p.badge && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-300">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                    <div className="w-20 h-20 shrink-0 rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center">
                      <img
                        src={getProductImage(p)}
                        alt={p.name}
                        onError={(e) => handleImageFallback(e, p.category)}
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-xl font-extrabold text-slate-900">
                          {formatINR(p.lowestPrice)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                          Amazon India
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-xs text-slate-600 border-t border-slate-200/80 pt-4">
                    <p className="line-clamp-2 leading-relaxed">
                      {p.shortDescription || 'Verified product with a checked Amazon India price.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Amazon India offer
                  </span>
                  <button
                    onClick={() => onNavigate(`/product/${p.slug}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
};
