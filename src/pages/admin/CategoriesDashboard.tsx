import React, { useMemo } from 'react';
import { useFindoraStore } from '../../services/store';
import { deriveCategories } from '../../utils/categories';

// Categories come from the products themselves — the Firestore `categories`
// collection is empty and nothing reads it (the old page showed "No
// categories found" forever, and its Seed button would have written 33
// generic names nothing uses). This page now shows the real derived
// categories with live product counts. To rename or move a category, edit
// the product's category in Product Management.
export const CategoriesDashboard: React.FC = () => {
  const store = useFindoraStore();
  const products = store.getAllProductsWithPrices(false);
  const derived = useMemo(() => deriveCategories(products), [products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Categories</h2>
        <span className="text-xs font-semibold text-slate-600">
          {derived.length} categories · {products.length} products
        </span>
      </div>

      <p className="text-xs text-slate-600 -mt-3">
        Derived live from the catalogue — a category exists because products
        carry it. Change a product&apos;s category in Product Management and
        it updates here automatically.
      </p>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Slug</th>
              <th className="px-6 py-4 font-bold text-right">Products</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {derived.map((c) => (
              <tr key={c.key} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                <td className="px-6 py-4">/category/{c.slug}</td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">{c.count}</td>
              </tr>
            ))}
            {derived.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-600">
                  No categories found — no products in the catalogue yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
