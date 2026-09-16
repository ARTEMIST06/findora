import React, { useState, useEffect } from 'react';
import { useFindoraStore } from '../../services/store';
import { Brand } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const BrandsDashboard: React.FC = () => {
  const store = useFindoraStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Partial<Brand> | null>(null);

  useEffect(() => {
    store.getBrands().then(setBrands);
  }, []);


  const handleSeed = async () => {
    const brandsList = [
      "Apple", "Samsung", "OnePlus", "Xiaomi", "Sony", "JBL", "Bose", "Anker", "UGREEN", "Logitech",
      "Dell", "HP", "Lenovo", "ASUS", "Acer", "TP-Link", "Philips", "Dyson", "Havells", "Bajaj",
      "Prestige", "Pigeon", "Wonderchef", "Borosil", "Milton", "Wakefit", "SleepyCat", "Decathlon",
      "Garmin", "Amazfit", "boAt", "Noise", "Fossil", "LEGO", "R for Rabbit", "LuvLap", "Oral-B", "Braun",
      "Microsoft", "Google", "Nothing", "Motorola", "Realme", "Vivo", "Oppo", "LG", "Whirlpool", "Godrej",
      "Voltas", "Panasonic", "IFB", "Bosch", "Siemens", "TCL", "Hisense", "Vu", "Blaupunkt", "Marshall",
      "Sennheiser", "Skullcandy", "Boult", "Mivi", "Zebronics", "Portronics", "Spigen", 
      "Belkin", "Ambrane", "Syska", "Crompton", "Orient", "V-Guard", "Symphony", "Kenstar", "Morphy Richards",
      "Black+Decker", "Eureka Forbes", "Kent", "Livpure", "HUL Pureit", "Aquaguard", "Cello", "Tupperware",
      "Treo", "Nayasa", "IKEA", "Herman Miller", "Steelcase", "Green Soul", "Cellbell", "Sleepwell",
      "Duroflex", "Sunday", "Kurl-on", "Adidas", "Nike", "Puma", "Reebok", "Asics", "New Balance", "Skechers",
      "Yonex", "Nivia", "Cosco", "Fastrack", "Casio", "Titan", "Timex", "Rolex", "Seiko", "Citizen", "Tommy Hilfiger",
      "Gillette", "Nivea", "Dove", "L'Oreal", "Maybelline", "Lakme", "Mamaearth", "WOW Skin Science", "Plum"
    ];
    let count = 0;
    for (const b of [...new Set(brandsList)]) {
      const id = b.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await store.saveBrand({ id, name: b } as Brand);
      count++;
    }
    alert(`Seeded ${count} brands!`);
    setBrands(await store.getBrands());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand?.name) return;
    const brand = {
      ...currentBrand,
      id: currentBrand.id || Date.now().toString(),
    } as Brand;
    await store.saveBrand(brand);
    setBrands(await store.getBrands());
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Brands</h2>
        <button
          onClick={() => {
            setCurrentBrand({ name: '' });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
        <button onClick={handleSeed} className="ml-2 px-4 py-2 bg-slate-200 rounded-xl text-sm font-semibold">Seed Brands</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{b.name}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setCurrentBrand(b);
                      setIsEditing(true);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                  No brands found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && currentBrand && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900">{currentBrand.id ? 'Edit Brand' : 'Add Brand'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={currentBrand.name || ''}
                  onChange={(e) => setCurrentBrand({ ...currentBrand, name: e.target.value })}
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
