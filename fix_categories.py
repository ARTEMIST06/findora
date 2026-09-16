import re

with open("src/pages/admin/CategoriesDashboard.tsx", "r") as f:
    content = f.read()

seed_func = """
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
"""

content = content.replace("  const handleSave = async (e: React.FormEvent) => {", seed_func + "\n  const handleSave = async (e: React.FormEvent) => {")
content = content.replace('Add Category\n        </button>', 'Add Category\n        </button>\n        <button onClick={handleSeed} className="ml-2 px-4 py-2 bg-slate-200 rounded-xl text-sm font-semibold">Seed Categories</button>')

with open("src/pages/admin/CategoriesDashboard.tsx", "w") as f:
    f.write(content)
