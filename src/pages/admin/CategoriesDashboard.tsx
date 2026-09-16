import React, { useState, useEffect } from 'react';
import { useFindoraStore } from '../../services/store';
import { Category } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const CategoriesDashboard: React.FC = () => {
  const store = useFindoraStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    store.fetchCategories().then(setCategories);
  }, []);


  const handleSeed = async () => {
    const categoriesList = [
      "Electronics", "Mobiles & Accessories", "Computers & Accessories", "Audio", "Cameras", "TV & Home Entertainment",
      "Smart Home", "Large Appliances", "Small Appliances", "Kitchen", "Home", "Furniture", "Home Improvement",
      "Beauty", "Personal Care", "Health", "Grocery", "Baby Products", "Toys & Games", "Sports & Fitness",
      "Luggage & Travel", "Automotive", "Books", "Office Products", "Pet Supplies", "Garden & Outdoor",
      "Fashion", "Shoes", "Watches", "Jewellery", "Musical Instruments", "Tools", "Industrial & Scientific"
    ];
    let count = 0;
    for (const c of categoriesList) {
      const id = c.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await store.saveCategory({ id, slug: id, name: c, icon: '', description: '', popularBrands: [] } as Category);
      count++;
    }
    alert(`Seeded ${count} categories!`);
    setCategories(await store.fetchCategories());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory?.name || !currentCategory?.slug) return;
    const cat = {
      ...currentCategory,
      id: currentCategory.id || Date.now().toString(),
    } as Category;
    await store.saveCategory(cat);
    setCategories(await store.fetchCategories());
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Categories</h2>
        <button
          onClick={() => {
            setCurrentCategory({ name: '', slug: '', description: '', icon: '', popularBrands: [] });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
        <button onClick={handleSeed} className="ml-2 px-4 py-2 bg-slate-200 rounded-xl text-sm font-semibold">Seed Categories</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Slug</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                <td className="px-6 py-4">{c.slug}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setCurrentCategory(c);
                      setIsEditing(true);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && currentCategory && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900">{currentCategory.id ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={currentCategory.name || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={currentCategory.slug || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
