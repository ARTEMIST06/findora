import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Add import * as XLSX from 'xlsx';
code = re.sub(r"import \{ useToast \} from '\.\./\.\./components/common/Toast';", 
              "import { useToast } from '../../components/common/Toast';\nimport * as XLSX from 'xlsx';", 
              code)

# Add Download to lucide-react imports
if 'Download' not in code:
    code = code.replace('ExternalLink,', 'ExternalLink,\n  Download,')

# Add export function inside component, e.g., below handleOpenNewProduct
export_func = """  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const allProducts = store.getAllProductsWithPrices(false); // get all including drafts
      const allStores = store.getStores();
      
      const exportData = allProducts.map(p => {
        const primaryOffer = p.offers && p.offers.length > 0 ? p.offers[0] : null;
        let merchantName = '';
        if (primaryOffer) {
           const st = allStores.find(s => s.id === primaryOffer.storeId);
           if (st) merchantName = st.name;
        }

        return {
          merchant: merchantName,
          productUrl: primaryOffer?.productUrl || '',
          affiliateUrl: primaryOffer?.affiliateUrl || '',
          title: p.name || '',
          brand: p.brand || '',
          category: p.category || '',
          image: p.images && p.images.length > 0 ? p.images[0] : '',
          currentPrice: primaryOffer?.price || '',
          mrp: primaryOffer?.originalPrice || '',
          availability: primaryOffer?.availability || 'in_stock',
          badge: p.badge || '',
          shortPitch: p.shortDescription || '',
          whyFindoraPickedIt: p.whyFindora || '',
          published: p.published !== false,
          featured: !!p.featured,
          productId: p.id,
          merchantProductId: primaryOffer?.merchantProductId || ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, "Findora_Products_Export.xlsx");
      addToast('success', 'Products exported successfully!');
    } catch (err: any) {
      console.error("Export Error: ", err);
      addToast('error', err.message || 'Failed to export products');
    } finally {
      setIsExporting(false);
    }
  };
"""

code = code.replace("const handleOpenNewProduct = () => {", export_func + "\n  const handleOpenNewProduct = () => {")


# Add export button to Top Header
export_btn = """          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : <Download className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Products'}</span>
            <span className="sm:hidden">{isExporting ? 'Wait' : 'Export'}</span>
          </button>"""

header_match = """<button
            onClick={() => onNavigate('/')}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>View Public Site</span>
          </button>"""

if header_match in code:
    code = code.replace(header_match, header_match + "\n" + export_btn)
else:
    print("Header match not found. Will try another replacement.")

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)
print("Patched.")
