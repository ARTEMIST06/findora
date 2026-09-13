import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useFindoraStore } from '../../services/store';
import { formatINR } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';

interface ComparePageProps {
  onNavigate: (route: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({ onNavigate }) => {
  const store = useFindoraStore();
  const { showToast } = useToast();

  const compareProducts = store.getCompareList();
  const allProducts = store.getAllProductsWithPrices(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const handleRemove = (id: string) => {
    store.removeFromCompare(id);
    showToast('Product removed from comparison', 'info');
  };

  const handleClearAll = () => {
    store.clearCompare();
    showToast('Comparison cleared', 'info');
  };

  const handleAddProduct = (productId: string) => {
    const success = store.addToCompare(productId);
    if (success) {
      showToast('Product added to comparison', 'success');
      setIsAddModalOpen(false);
    } else {
      showToast('Maximum 4 products allowed in comparison', 'error');
    }
  };

  // Find all unique specification keys across comparing products
  const allSpecKeys = Array.from(
    new Set(compareProducts.flatMap((p) => Object.keys(p.specifications)))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <SEOHead 
        title="Compare Products - Findora"
        description="Compare prices, specifications, and features side-by-side to make the best purchasing decision."
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Product Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Compare Devices Side-by-Side
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare store pricing, hardware specifications, and editorial verdicts for up to 4 devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {compareProducts.length < 4 && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product ({compareProducts.length}/4)</span>
            </button>
          )}

          {compareProducts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Comparison Grid or Empty State */}
      {compareProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No products in comparison</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Add 2 to 4 products to compare their lowest store prices, detailed hardware specs, and pros & cons side-by-side.
          </p>
          <button
            onClick={() => onNavigate('/products')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Explore Catalog to Compare
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[720px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header Row: Products Overview */}
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-200">
              <div className="p-4 bg-slate-50/80 font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center">
                Product Info
              </div>
              {compareProducts.map((product) => (
                <div key={product.id} className="p-5 flex flex-col justify-between relative group">
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from compare"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-24 h-24 object-contain mb-3"
                    />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    <h4
                      onClick={() => onNavigate(`/product/${product.slug}`)}
                      className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer mt-1"
                    >
                      {product.name}
                    </h4>

                    {/* Price */}
                    <div className="mt-3">
                      <span className="text-xs text-slate-400 block">Lowest Price</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatINR(product.lowestPrice)}
                      </span>
                      {product.bestStore && (
                        <span className="text-[11px] text-emerald-600 font-semibold block">
                          at {product.bestStore.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onNavigate(`/product/${product.slug}`)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>All Offers</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Blank slot to add another product if < 4 */}
              {compareProducts.length < 4 && (
                <div className="p-5 flex flex-col items-center justify-center text-center bg-slate-50/40 border-dashed border-2 border-slate-200 m-4 rounded-xl">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors mb-2"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700">Add Another</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Compare up to 4</span>
                </div>
              )}
            </div>

            {/* Ratings row */}
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 py-3 text-xs">
              <div className="p-4 font-semibold text-slate-500 bg-slate-50/40">Rating</div>
              {compareProducts.map((p) => (
                <div key={p.id} className="p-4 font-bold text-amber-600">
                  ★ {p.rating || 'N/A'}{' '}
                  <span className="text-slate-400 font-normal">({p.reviewCount || 0})</span>
                </div>
              ))}
            </div>

            {/* Store availability row */}
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 py-3 text-xs">
              <div className="p-4 font-semibold text-slate-500 bg-slate-50/40">Store Options</div>
              {compareProducts.map((p) => (
                <div key={p.id} className="p-4 text-slate-700 font-medium">
                  {p.offers.length} stores compared
                </div>
              ))}
            </div>

            {/* Why Picked It */}
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 py-3 text-xs">
              <div className="p-4 font-semibold text-slate-500 bg-slate-50/40">Why We Picked It</div>
              {compareProducts.map((p) => (
                <div key={p.id} className="p-4 text-slate-600 text-xs leading-relaxed">
                  {p.whyFindora}
                </div>
              ))}
            </div>

            {/* Specifications rows */}
            <div className="bg-slate-100/70 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hardware & Specs
            </div>
            {allSpecKeys.map((key) => (
              <div
                key={key}
                className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 py-2.5 text-xs hover:bg-slate-50"
              >
                <div className="p-4 font-medium text-slate-500 bg-slate-50/40">{key}</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className="p-4 font-semibold text-slate-900">
                    {p.specifications[key] || '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Select Product to Compare</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search products by title or brand..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {allProducts
                .filter(
                  (p) =>
                    !compareProducts.some((cp) => cp.id === p.id) &&
                    (p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
                      p.brand.toLowerCase().includes(modalSearch.toLowerCase()))
                )
                .map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod.id)}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/30 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-12 h-12 object-contain rounded-lg p-1 bg-white border border-slate-100"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-blue-600">
                          {prod.brand}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {prod.name}
                        </h4>
                        <span className="text-xs font-bold text-emerald-600">
                          {formatINR(prod.lowestPrice)}
                        </span>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0">
                      Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
