import re

with open("src/pages/admin/BrandsDashboard.tsx", "r") as f:
    content = f.read()

seed_func = """
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
"""

content = content.replace("  const handleSave = async (e: React.FormEvent) => {", seed_func + "\n  const handleSave = async (e: React.FormEvent) => {")
content = content.replace('Add Brand\n        </button>', 'Add Brand\n        </button>\n        <button onClick={handleSeed} className="ml-2 px-4 py-2 bg-slate-200 rounded-xl text-sm font-semibold">Seed Brands</button>')

with open("src/pages/admin/BrandsDashboard.tsx", "w") as f:
    f.write(content)
