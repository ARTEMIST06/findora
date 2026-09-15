import os

component_code = """
import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { store } from '../../services/store';
import { Product, PriceOffer, Store } from '../../types';

interface ProcessedRow {
  id: string;
  raw: any;
  merchantId: string;
  productUrl: string;
  affiliateUrl: string;
  validationStatus: 'valid' | 'invalid';
  validationErrors: string[];
  autoFetchStatus: 'ready' | 'unavailable' | 'error' | 'pending' | 'success' | 'none';
  duplicateStatus: 'new' | 'duplicate_offer' | 'duplicate_product';
  overallStatus: 'ready' | 'needs_review' | 'error' | 'imported';
  productData: Partial<Product>;
  offerData: Partial<PriceOffer>;
  existingProductId?: string;
  existingOfferId?: string;
}

export function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStores(store.getStores());
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const hist = await store.getImportHistory();
    setHistory(hist);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setProcessedRows([]);
  };

  const parseFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessedRows([]);

    try {
      let rawData: any[] = [];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rawData = result.data;
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        alert("Unsupported file format. Use CSV or XLSX.");
        setIsProcessing(false);
        return;
      }

      await processRows(rawData);
    } catch (e) {
      console.error("Error parsing file:", e);
      alert("Error parsing file");
    } finally {
      setIsProcessing(false);
    }
  };

  const findMerchant = (merchantStr: string): string => {
    if (!merchantStr) return '';
    const s = merchantStr.toLowerCase().trim();
    const matched = stores.find(st => st.name.toLowerCase() === s || st.slug.toLowerCase() === s || st.id === s);
    if (matched) return matched.id;
    if (s.includes('amazon')) return 'amazon';
    if (s.includes('flipkart')) return 'flipkart';
    if (s.includes('croma')) return 'croma';
    return '';
  };

  const processRows = async (rawData: any[]) => {
    const newRows: ProcessedRow[] = [];
    const existingOffers = store.getOffers();
    const existingProducts = store.getAllProductsWithPrices(false);

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      let merchantStr = row.merchant || row.Merchant || row.store || '';
      let productUrl = row.productUrl || row['Product URL'] || row.url || '';
      let affiliateUrl = row.affiliateUrl || row['Affiliate URL'] || row.trackingUrl || '';
      
      const merchantId = findMerchant(merchantStr);
      let validationErrors: string[] = [];
      if (!merchantId) validationErrors.push("Invalid or missing merchant");
      if (!productUrl) validationErrors.push("Missing product URL");
      if (!affiliateUrl) validationErrors.push("Missing affiliate URL");

      const isValid = validationErrors.length === 0;

      let pRow: ProcessedRow = {
        id: `row-${Date.now()}-${i}`,
        raw: row,
        merchantId,
        productUrl,
        affiliateUrl,
        validationStatus: isValid ? 'valid' : 'invalid',
        validationErrors,
        autoFetchStatus: isValid ? 'pending' : 'none',
        duplicateStatus: 'new',
        overallStatus: isValid ? 'ready' : 'error',
        productData: {
          name: row.title || row.Title || '',
          brand: row.brand || row.Brand || '',
          category: row.category || row.Category || '',
          shortDescription: row.shortPitch || '',
          whyFindora: row.whyFindoraPickedIt || '',
          images: row.image ? [row.image] : [],
          published: row.published === 'true' || row.published === true || false,
          featured: row.featured === 'true' || row.featured === true || false,
        },
        offerData: {
          price: parseFloat(row.currentPrice || row.Price || 0) || 0,
          originalPrice: parseFloat(row.mrp || row.MRP || 0) || undefined,
          availability: (row.availability || 'in_stock') as any
        }
      };

      if (isValid) {
        // Attempt to fetch from API
        try {
          const res = await fetch('/api/fetch-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: productUrl, merchantId })
          });
          const data = await res.json();
          
          if (!data.success) {
            pRow.autoFetchStatus = 'unavailable';
            pRow.overallStatus = 'needs_review';
          } else {
            pRow.autoFetchStatus = 'success';
            const pd = data.product;
            
            pRow.productData.name = pd.title || pRow.productData.name;
            pRow.productData.brand = pd.brand || pRow.productData.brand;
            pRow.productData.category = pd.category || pRow.productData.category;
            if (pd.images?.length > 0) pRow.productData.images = pd.images;
            
            if (!pRow.offerData.price && pd.currentPrice) pRow.offerData.price = pd.currentPrice;
            if (!pRow.offerData.originalPrice && pd.mrp) pRow.offerData.originalPrice = pd.mrp;
            pRow.offerData.availability = pd.availability || pRow.offerData.availability;
            pRow.offerData.merchantProductId = pd.merchantProductId;
            
            // Check Duplicates
            if (pd.merchantProductId) {
               const existOff = existingOffers.find(o => o.storeId === merchantId && o.merchantProductId === pd.merchantProductId);
               if (existOff) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOff.id;
                 pRow.existingProductId = existOff.productId;
                 pRow.overallStatus = 'needs_review';
               }
            } else {
               const existOffUrl = existingOffers.find(o => o.storeId === merchantId && o.productUrl === productUrl);
               if (existOffUrl) {
                 pRow.duplicateStatus = 'duplicate_offer';
                 pRow.existingOfferId = existOffUrl.id;
                 pRow.existingProductId = existOffUrl.productId;
                 pRow.overallStatus = 'needs_review';
               }
            }
          }
        } catch (e) {
          pRow.autoFetchStatus = 'error';
          pRow.overallStatus = 'needs_review';
        }
      }

      // Check if price is 0 -> needs review
      if (pRow.overallStatus === 'ready' && (!pRow.offerData.price || pRow.offerData.price <= 0)) {
         pRow.overallStatus = 'needs_review';
      }
      // Check if title is missing
      if (pRow.overallStatus === 'ready' && !pRow.productData.name) {
         pRow.overallStatus = 'needs_review';
      }

      newRows.push(pRow);
      setProcessedRows([...newRows]); // incremental update
    }
  };

  const handleImport = async (importAsDrafts: boolean) => {
    setIsImporting(true);
    setImportProgress(0);
    let imported = 0;
    let needsReview = 0;
    let skipped = 0;
    let failed = 0;

    const rowsToProcess = processedRows.filter(r => r.validationStatus === 'valid' && r.duplicateStatus === 'new');
    
    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      try {
        const productInput = {
          name: row.productData.name || 'Untitled',
          brand: row.productData.brand || 'Unknown',
          category: row.productData.category || 'electronics',
          shortDescription: row.productData.shortDescription || '',
          description: row.productData.description || '',
          images: row.productData.images || [],
          specifications: {},
          pros: [],
          cons: [],
          whyFindora: row.productData.whyFindora || '',
          tags: [],
          published: importAsDrafts ? false : (row.productData.published ?? true),
          featured: row.productData.featured ?? false,
          slug: (row.productData.name || 'Untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4)
        };

        const newProduct = await store.addProduct(productInput);
        
        await store.addOffer({
          productId: newProduct.id,
          storeId: row.merchantId,
          price: row.offerData.price || 0,
          originalPrice: row.offerData.originalPrice,
          currency: 'INR',
          affiliateUrl: row.affiliateUrl,
          availability: row.offerData.availability || 'in_stock',
          sourceType: 'manual',
          merchantProductId: row.offerData.merchantProductId,
          productUrl: row.productUrl,
          syncStatus: row.autoFetchStatus === 'success' ? 'automatic' : 'manual'
        });

        imported++;
        row.overallStatus = 'imported';
      } catch (e) {
        console.error("Import failed for row", row, e);
        failed++;
        row.overallStatus = 'error';
      }
      setImportProgress(Math.round(((i + 1) / rowsToProcess.length) * 100));
    }

    skipped = processedRows.length - (imported + failed);
    const currentUserStr = localStorage.getItem('findora_current_user_v1');
    const importedBy = currentUserStr ? JSON.parse(currentUserStr).email : 'Unknown';
    
    await store.addImportHistory({
      id: `import-${Date.now()}`,
      fileName: file?.name || 'Unknown',
      importedBy,
      importedAt: new Date().toISOString(),
      totalRows: processedRows.length,
      imported,
      needsReview: processedRows.filter(r => r.overallStatus === 'needs_review').length,
      skipped,
      failed
    });

    setIsImporting(false);
    loadHistory();
    alert(`Import Complete. Imported: ${imported}, Failed: ${failed}, Skipped/Needs Review: ${skipped}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold">Ready</span>;
      case 'needs_review': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold">Needs Review</span>;
      case 'error': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] font-bold">Error</span>;
      case 'imported': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold">Imported</span>;
      default: return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-slate-200">
        <button 
          className={`pb-2 px-1 font-semibold text-sm ${activeTab === 'import' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('import')}
        >
          New Import
        </button>
        <button 
          className={`pb-2 px-1 font-semibold text-sm ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('history')}
        >
          Import History
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-bold text-lg text-slate-900">Upload CSV / Excel</h2>
            <p className="text-sm text-slate-500">
              Columns required: <strong>merchant</strong>, <strong>productUrl</strong>, <strong>affiliateUrl</strong>
            </p>
            <div className="flex items-center space-x-4">
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={parseFile}
                disabled={!file || isProcessing || isImporting}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50 whitespace-nowrap"
              >
                {isProcessing ? 'Processing...' : 'Process File'}
              </button>
            </div>
          </div>

          {processedRows.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h3 className="font-bold text-slate-900">Preview & Validation</h3>
                  <div className="text-xs text-slate-500 flex space-x-4 mt-1">
                    <span>Total: {processedRows.length}</span>
                    <span className="text-emerald-600">Ready: {processedRows.filter(r => r.overallStatus === 'ready').length}</span>
                    <span className="text-amber-600">Needs Review: {processedRows.filter(r => r.overallStatus === 'needs_review').length}</span>
                    <span className="text-red-600">Errors: {processedRows.filter(r => r.overallStatus === 'error').length}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleImport(true)}
                    disabled={isImporting || processedRows.filter(r => r.overallStatus === 'ready').length === 0}
                    className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 disabled:opacity-50"
                  >
                    Import as Drafts
                  </button>
                  <button 
                    onClick={() => handleImport(false)}
                    disabled={isImporting || processedRows.filter(r => r.overallStatus === 'ready').length === 0}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Import Valid Rows
                  </button>
                </div>
              </div>

              {isImporting && (
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">#</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Product URL</th>
                      <th className="px-4 py-3">Affiliate URL</th>
                      <th className="px-4 py-3">Auto Fetch</th>
                      <th className="px-4 py-3">Duplicate</th>
                      <th className="px-4 py-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {processedRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{row.merchantId || <span className="text-red-500">Unknown</span>}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={row.productUrl}>{row.productUrl}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={row.affiliateUrl}>{row.affiliateUrl}</td>
                        <td className="px-4 py-3">
                           {row.autoFetchStatus === 'unavailable' && <span className="text-amber-500 text-xs">API Unavailable</span>}
                           {row.autoFetchStatus === 'success' && <span className="text-emerald-500 text-xs">Fetched</span>}
                           {row.autoFetchStatus === 'error' && <span className="text-red-500 text-xs">Error</span>}
                           {row.autoFetchStatus === 'pending' && <span className="text-blue-500 text-xs">...</span>}
                        </td>
                        <td className="px-4 py-3">
                           {row.duplicateStatus !== 'new' ? <span className="text-amber-500 text-xs">Duplicate</span> : '-'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(row.overallStatus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="font-bold text-lg text-slate-900">Import History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No import history found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Date</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Imported</th>
                    <th className="px-4 py-3 text-center">Review/Skipped</th>
                    <th className="px-4 py-3 text-center rounded-r-xl">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map(h => (
                    <tr key={h.id}>
                      <td className="px-4 py-3 text-slate-700">{new Date(h.importedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500">{h.fileName}</td>
                      <td className="px-4 py-3 text-slate-500">{h.importedBy}</td>
                      <td className="px-4 py-3 text-center font-medium">{h.totalRows}</td>
                      <td className="px-4 py-3 text-center text-emerald-600">{h.imported}</td>
                      <td className="px-4 py-3 text-center text-amber-600">{h.needsReview + h.skipped}</td>
                      <td className="px-4 py-3 text-center text-red-600">{h.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
"""

with open('src/pages/admin/BulkImport.tsx', 'w') as f:
    f.write(component_code)

print("done creating bulk import component")
