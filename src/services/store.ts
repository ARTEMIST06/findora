import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Product,
  Store,
  PriceOffer,
  Category,
  User,
  AffiliateClick,
  ProductWithPrices,
  UserRole,
  PriceAlert,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_STORES,
  INITIAL_CATEGORIES,
  INITIAL_PRICE_OFFERS,
  INITIAL_USERS,
  INITIAL_PRICE_HISTORY,
} from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'findora_products_v1',
  STORES: 'findora_stores_v1',
  OFFERS: 'findora_offers_v1',
  CATEGORIES: 'findora_categories_v1',
  USERS: 'findora_users_v1',
  CURRENT_USER: 'findora_current_user_v1',
  WISHLIST: 'findora_wishlist_v1',
  COMPARE: 'findora_compare_v1',
  CLICKS: 'findora_clicks_v1',
};

// Event bus for reactivity across components
const EVENT_NAME = 'findora_store_change';
let storeVersion = 0;
function notifyChange() {
  storeVersion++;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

// Storage helpers
function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Store singleton class
class FindoraStore {
  // --- DRAFTS ---
  async getDrafts(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'productDrafts'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching drafts:", e);
      return [];
    }
  }

  async getDraft(draftId: string): Promise<any | null> {
    if (typeof window === 'undefined') return null;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'productDrafts', draftId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
      console.error("Error fetching draft:", e);
      return null;
    }
  }

  async saveDraft(draft: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'productDrafts', draft.id), draft, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving draft:", e);
      return false;
    }
  }

  async deleteDraft(draftId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'productDrafts', draftId));
      return true;
    } catch (e) {
      console.error("Error deleting draft:", e);
      return false;
    }
  }

  // --- BRANDS ---
  async getBrands(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching brands:", e);
      return [];
    }
  }

  async saveBrand(brand: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'brands', brand.id), brand, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving brand:", e);
      return false;
    }
  }

  // --- CATEGORIES ---
  async fetchCategories(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching categories:", e);
      return [];
    }
  }

  async saveCategory(category: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'categories', category.id), category, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving category:", e);
      return false;
    }
  }


  async getImportHistory(): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'importHistory'), orderBy('importedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching import history:", e);
      return [];
    }
  }

  async addImportHistory(history: any): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'importHistory', history.id), history);
    } catch (e) {
      console.error("Error adding import history:", e);
    }
  }
  private products: Product[] = [];
  private stores: Store[] = [];
  private offers: PriceOffer[] = [];
  private categories: Category[] = [];
  private users: User[] = [];
  private currentUser: User | null = null;
  private authLoading: boolean = true;
  private wishlist: string[] = []; // product IDs
  private compareIds: string[] = []; // max 4 product IDs
  private clicks: AffiliateClick[] = [];

  constructor() {
    this.init();
  }

  private initFirebase() {
    if (typeof window === 'undefined') return;
    
    // Lazy import to avoid server-side issues
    import('../lib/firebase').then(({ db, auth }) => {
      import('firebase/firestore').then(({ collection, onSnapshot, doc, getDoc, setDoc }) => {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          
          // Products listener
          onSnapshot(collection(db, 'products'), (snapshot) => {
            this.products = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
            notifyChange();
          });

          // Stores listener
          onSnapshot(collection(db, 'stores'), (snapshot) => {
            if (!snapshot.empty) {
              this.stores = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Store));
            } else {
              // If empty, auto-seed Amazon so they can at least add Amazon offers
              const amazon = INITIAL_STORES.find(s => s.id === 'store-amazon');
              if (amazon) {
                setDoc(doc(db, 'stores', amazon.id), amazon).catch(console.error);
                this.stores = [amazon];
              }
            }
            notifyChange();
          });

          // Offers listener
          onSnapshot(collection(db, 'offers'), (snapshot) => {
            this.offers = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PriceOffer));
            notifyChange();
          });

          // Auth state listener
          let unsubscribeWishlist: (() => void) | null = null;
          
          onAuthStateChanged(auth, async (user) => {
            if (user) {
              const emailLower = (user.email || '').toLowerCase().trim();
              const isBootstrappedAdmin = emailLower === 'aryasingh2366@gmail.com' || emailLower === 'admin@findora.com';
              const isBootstrappedEditor = emailLower === 'editor@findora.com';
              const targetRole = isBootstrappedAdmin ? 'admin' : (isBootstrappedEditor ? 'editor' : 'shopper');

              const userRef = doc(db, 'users', user.uid);
              try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const existingData = userSnap.data() as User;
                  if ((isBootstrappedAdmin || isBootstrappedEditor) && existingData.role !== targetRole) {
                    existingData.role = targetRole;
                    setDoc(userRef, { role: targetRole, lastLogin: new Date().toISOString() }, { merge: true }).catch(console.error);
                  } else {
                    setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true }).catch(console.error);
                  }
                  this.currentUser = { ...existingData, id: userSnap.id } as User;
                } else {
                  const newUser: User = {
                    id: user.uid,
                    email: user.email || '',
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    role: targetRole,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                  };
                  if (user.photoURL) {
                    newUser.avatar = user.photoURL;
                  }
                  await setDoc(userRef, newUser);
                  this.currentUser = newUser;
                }
              } catch (userDocErr) {
                console.error("Error reading/writing user doc:", userDocErr);
                // Fallback in memory
                this.currentUser = {
                  id: user.uid,
                  email: user.email || '',
                  name: user.displayName || user.email?.split('@')[0] || 'User',
                  role: targetRole,
                  createdAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString(),
                  avatar: user.photoURL || undefined,
                };
              }
              
              // Wishlist listener
              if (unsubscribeWishlist) unsubscribeWishlist();
              unsubscribeWishlist = onSnapshot(doc(db, 'wishlists', user.uid), (wSnap) => {
                let remoteWishlist: string[] = [];
                if (wSnap.exists()) {
                  remoteWishlist = wSnap.data().productIds || [];
                }
                
                // Merge local wishlist if we have one and it hasn't been merged yet
                const localWishlist = getFromStorage(STORAGE_KEYS.WISHLIST, []);
                if (localWishlist.length > 0) {
                  const merged = Array.from(new Set([...remoteWishlist, ...localWishlist]));
                  this.wishlist = merged;
                  setDoc(doc(db, 'wishlists', user.uid), { productIds: merged }, { merge: true }).catch(console.error);
                  localStorage.removeItem(STORAGE_KEYS.WISHLIST);
                } else {
                  this.wishlist = remoteWishlist;
                }
                notifyChange();
              });
              
            } else {

              this.currentUser = null;
              this.wishlist = [];
              localStorage.removeItem(STORAGE_KEYS.WISHLIST);
              if (unsubscribeWishlist) {

                unsubscribeWishlist();
                unsubscribeWishlist = null;
              }
            }
            this.authLoading = false;
            notifyChange();
          });
          
        });
      });
    }).catch(console.error);
  }

  private init() {
    // Keep local categories as they might be static
    this.categories = getFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.compareIds = getFromStorage(STORAGE_KEYS.COMPARE, []);
    this.wishlist = [];
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);
    
    // Temporarily load mock data so the UI isn't completely empty before Firebase loads
    this.products = getFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.stores = getFromStorage(STORAGE_KEYS.STORES, INITIAL_STORES.filter(s => s.id === 'store-amazon'));
    this.offers = getFromStorage(STORAGE_KEYS.OFFERS, INITIAL_PRICE_OFFERS.filter(o => o.storeId === 'store-amazon'));
    
    // Initialize real-time Firebase sync
    this.initFirebase();
  }

  // --- PRODUCTS ---
  getProducts(onlyPublished = false): Product[] {
    return onlyPublished
      ? this.products.filter((p) => p.published)
      : [...this.products];
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug || p.id === slug);
  }getProductWithPrices(idOrSlug: string): ProductWithPrices | undefined {
    const product = this.getProductBySlug(idOrSlug) || this.getProductById(idOrSlug);
    if (!product) return undefined;

    const allOffers = this.offers.filter((o) => o.productId === product.id);

    // Filter valid offers
    const productOffers = allOffers
      .filter((o) => o.availability === 'in_stock' || o.availability === 'pre_order' || o.availability === 'limited_stock')
      .filter(o => o.price != null && o.price > 0)
      .sort((a, b) => a.price - b.price);

    const lowestPrice = productOffers.length > 0 ? productOffers[0].price : undefined;
    const highestPrice = productOffers.length > 0 ? productOffers[productOffers.length - 1].price : undefined;
    
    let maxDiscountPercent = 0;
    productOffers.forEach((offer) => {
      if (offer.originalPrice && offer.originalPrice > offer.price) {
        const disc = Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100);
        if (disc > maxDiscountPercent) maxDiscountPercent = disc;
      }
    });

    const bestStore = productOffers.length > 0
      ? this.stores.find((s) => s.id === productOffers[0].storeId)
      : undefined;

    return {
      ...product,
      offers: allOffers, // Return all offers including out of stock
      lowestPrice,
      highestPrice,
      maxDiscountPercent: maxDiscountPercent > 0 ? maxDiscountPercent : undefined,
      bestStore,
    };
  }

  getAllProductsWithPrices(onlyPublished = true): ProductWithPrices[] {
    const prods = this.getProducts(onlyPublished);
    return prods.map((p) => this.getProductWithPrices(p.id)!);
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    
    if (typeof window !== 'undefined') {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
    }
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    notifyChange();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const updated: Product = {
      ...this.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.products[idx] = updated;
    
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          updateDoc(doc(db, 'products', id), updates).catch(console.error);
        });
      });
    }
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    notifyChange();
    return updated;
  }

  deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    if (this.products.length !== initialLen) {
      if (typeof window !== 'undefined') {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, deleteDoc }) => {
            deleteDoc(doc(db, 'products', id)).catch(console.error);
          });
        });
      }
      // also remove offers
      this.offers = this.offers.filter((o) => o.productId !== id);

      this.wishlist = this.wishlist.filter((pid) => pid !== id);
      this.compareIds = this.compareIds.filter((pid) => pid !== id);
      saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
      saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
      saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);
      if (this.currentUser && typeof window !== 'undefined') {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            setDoc(doc(db, 'wishlists', this.currentUser!.id), {
              productIds: this.wishlist
            }, { merge: true }).catch(console.error);
          });
        });
      }

      notifyChange();
      return true;
    }
    return false;
  }

  duplicateProduct(id: string): Product | undefined {
    const orig = this.getProductById(id);
    if (!orig) return undefined;
    const now = new Date().toISOString();
    const duplicated: Product = {
      ...orig,
      id: `prod-${Date.now()}`,
      name: `${orig.name} (Copy)`,
      slug: `${orig.slug}-copy-${Date.now().toString().slice(-4)}`,
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(duplicated);
    // Duplicate its offers as well
    const origOffers = this.offers.filter((o) => o.productId === id);
    origOffers.forEach((off) => {
      this.offers.push({
        ...off,
        id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: duplicated.id,
      });
    });
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
    notifyChange();
    return duplicated;
  }

  togglePublish(id: string): boolean {
    const product = this.getProductById(id);
    if (!product) return false;
    this.updateProduct(id, { published: !product.published });
    return true;
  }

  // --- STORES ---
  getStores(): Store[] {
    return [...this.stores];
  }

  getStoreById(id: string): Store | undefined {
    return this.stores.find((s) => s.id === id);
  }

  addStore(store: Omit<Store, 'id'>): Store {
    const newStore: Store = {
      ...store,
      id: `store-${Date.now()}`,
    };
    this.stores.push(newStore);
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'stores', newStore.id), newStore).catch(console.error);
        });
      });
    }
    saveToStorage(STORAGE_KEYS.STORES, this.stores);
    notifyChange();
    return newStore;
  }

  updateStore(id: string, updates: Partial<Store>): Store | undefined {
    const idx = this.stores.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.stores[idx] = { ...this.stores[idx], ...updates };
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          updateDoc(doc(db, 'stores', id), updates).catch(console.error);
        });
      });
    }
    saveToStorage(STORAGE_KEYS.STORES, this.stores);
    notifyChange();
    return this.stores[idx];
  }

  toggleStoreActive(id: string): boolean {
    const s = this.getStoreById(id);
    if (!s) return false;
    this.updateStore(id, { isActive: !s.isActive });
    return true;
  }

  // --- PRICE OFFERS ---
  getOffers(): PriceOffer[] {
    return [...this.offers];
  }

  getOffersForProduct(productId: string): PriceOffer[] {
    return this.offers
      .filter((o) => o.productId === productId)
      .sort((a, b) => a.price - b.price);
  }

  async addPriceOffer(offer: Omit<PriceOffer, 'id' | 'lastUpdated'>): Promise<PriceOffer> {
    const newOffer: PriceOffer = {
      ...offer,
      id: `offer-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    this.offers.push(newOffer);
    if (typeof window !== 'undefined') {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'offers', newOffer.id), newOffer);
      
      // Add initial price history
      await this.addPriceHistory({
        id: `ph-${Date.now()}`,
        productId: newOffer.productId,
        offerId: newOffer.id,
        merchantId: newOffer.storeId,
        price: newOffer.price,
        mrp: newOffer.originalPrice || null,
        availability: newOffer.availability,
        source: newOffer.sourceType || 'manual',
        recordedAt: newOffer.lastUpdated,
        createdAt: newOffer.lastUpdated
      });
    }
    saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
    notifyChange();
    return newOffer;
  }

  async updatePriceOffer(id: string, updates: Partial<PriceOffer>): Promise<PriceOffer | undefined> {
    const idx = this.offers.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    
    const existingOffer = this.offers[idx];
    const now = new Date().toISOString();
    
    // Check if price or availability actually changed
    const priceChanged = updates.price !== undefined && updates.price !== existingOffer.price;
    const availabilityChanged = updates.availability !== undefined && updates.availability !== existingOffer.availability;
    
    let priceDrop = existingOffer.priceDrop;
    
    if (priceChanged) {
      if (updates.price! < existingOffer.price) {
        const dropAmount = existingOffer.price - updates.price!;
        priceDrop = {
          amount: dropAmount,
          percentage: Math.round((dropAmount / existingOffer.price) * 100),
          previousPrice: existingOffer.price,
          detectedAt: now
        };
      } else {
        // Price went up, clear the price drop
        priceDrop = undefined;
      }
    }

    const updatedOffer: PriceOffer = {
      ...existingOffer,
      ...updates,
      priceDrop,
      lastUpdated: now,
    };
    
    this.offers[idx] = updatedOffer;
    
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc, setDoc }) => {
          const updatePayload: any = {
            ...updates,
            lastUpdated: now,
          };
          if (priceChanged) {
             updatePayload.priceDrop = priceDrop || null; // use null for firestore if undefined
          }
          
          
                    updateDoc(doc(db, 'offers', id), updatePayload).catch(console.error);
                    
                    // Check price alerts
                    if (priceChanged && updates.price! < existingOffer.price) {
                      import('firebase/firestore').then(async ({ collection, getDocs, query, where }) => {
                        try {
                          const alertsQuery = query(collection(db, 'priceAlerts'), 
                            where('offerId', '==', id),
                            where('isActive', '==', true)
                          );
                          const alertsSnap = await getDocs(alertsQuery);
                          alertsSnap.forEach(async (alertDoc) => {
                            const alertData = alertDoc.data();
                            if (updates.price! <= alertData.targetPrice) {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              await updateDoc(doc(db, 'priceAlerts', alertDoc.id), {
                                isActive: false,
                                triggeredAt: now,
                                updatedAt: now
                              });
                              // In a real app, send email/push notification here
                              console.log(`Alert triggered for user ${alertData.userId} on offer ${id}!`);
                            }
                          });
                        } catch (e) {
                          console.error("Error processing price alerts:", e);
                        }
                      });
                    }

          
          if (priceChanged || availabilityChanged) {
             const phId = `ph-${Date.now()}`;
             setDoc(doc(db, 'priceHistory', phId), {
                id: phId,
                productId: updatedOffer.productId,
                offerId: updatedOffer.id,
                merchantId: updatedOffer.storeId,
                price: updatedOffer.price,
                mrp: updatedOffer.originalPrice || null,
                availability: updatedOffer.availability,
                source: updatedOffer.sourceType || 'manual',
                recordedAt: now,
                createdAt: now
             }).catch(console.error);
          }
        });
      });
    }
    saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
    notifyChange();
    return updatedOffer;
  }

  deletePriceOffer(id: string): boolean {
    const initialLen = this.offers.length;
    this.offers = this.offers.filter((o) => o.id !== id);
    if (this.offers.length !== initialLen) {
      if (typeof window !== 'undefined') {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, deleteDoc }) => {
            deleteDoc(doc(db, 'offers', id)).catch(console.error);
          });
        });
      }
      saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
      notifyChange();
      return true;
    }
    return false;
  }

  deleteOffer(id: string): boolean {
    return this.deletePriceOffer(id);
  }

  setOffer(
    productId: string,
    offerData: {
      storeId: string;
      price: number;
      originalPrice?: number;
      affiliateUrl?: string;
      inStock?: boolean;
      shippingNote?: string;
    }
  ): PriceOffer {
    const existingIdx = this.offers.findIndex(
      (o) => o.productId === productId && o.storeId === offerData.storeId
    );

    if (existingIdx !== -1) {
      this.offers[existingIdx] = {
        ...this.offers[existingIdx],
        price: offerData.price,
        originalPrice: offerData.originalPrice,
        affiliateUrl: offerData.affiliateUrl || this.offers[existingIdx].affiliateUrl,
        availability: offerData.inStock === false ? 'out_of_stock' : 'in_stock',
        shippingNote: offerData.shippingNote,
        lastUpdated: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, updateDoc }) => {
            updateDoc(doc(db, 'offers', this.offers[existingIdx].id), {
              price: offerData.price,
              originalPrice: offerData.originalPrice,
              affiliateUrl: offerData.affiliateUrl || this.offers[existingIdx].affiliateUrl,
              availability: offerData.inStock === false ? 'out_of_stock' : 'in_stock',
              shippingNote: offerData.shippingNote,
              lastUpdated: new Date().toISOString(),
            }).catch(console.error);
          });
        });
      }
      saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
      notifyChange();
      return this.offers[existingIdx];
    } else {
      const newOffer: PriceOffer = {
        id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId,
        storeId: offerData.storeId,
        price: offerData.price,
        originalPrice: offerData.originalPrice,
        currency: 'INR',
        affiliateUrl: offerData.affiliateUrl || 'https://amazon.in',
        availability: offerData.inStock === false ? 'out_of_stock' : 'in_stock',
        lastUpdated: new Date().toISOString(),
        sourceType: 'manual',
        shippingNote: offerData.shippingNote,
      };
      this.offers.push(newOffer);
      if (typeof window !== 'undefined') {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            setDoc(doc(db, 'offers', newOffer.id), newOffer).catch(console.error);
          });
        });
      }
      saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
      notifyChange();
      return newOffer;
    }
  }

  // --- CATEGORIES ---
  getCategories(): Category[] {
    return [...this.categories];
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find((c) => c.slug === slug || c.id === slug);
  }

  // --- AUTH & ROLES ---
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthLoading(): boolean {
    return this.authLoading;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  login(email: string): User | null {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      this.currentUser = user;
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
      notifyChange();
      return user;
    }
    // Auto register if not found
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'shopper',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    notifyChange();
    return newUser;
  }

  signup(name: string, email: string, role: UserRole = 'shopper'): User {
    const existing = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      this.currentUser = existing;
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.currentUser = newUser;
      saveToStorage(STORAGE_KEYS.USERS, this.users);
    }
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    notifyChange();
    return this.currentUser;
  }

  
  async deleteAccount(): Promise<{ success: boolean; message: string; requiresReauth?: boolean }> {
    if (!this.currentUser || typeof window === 'undefined') return { success: false, message: 'Not logged in' };
    
    try {
      const { auth, db } = await import('../lib/firebase');
      const { deleteUser, getIdToken } = await import('firebase/auth');
      const { collection, query, where, getDocs, deleteDoc, doc, writeBatch } = await import('firebase/firestore');
      
      const user = auth.currentUser;
      if (!user) return { success: false, message: 'Authentication session lost' };

      const uid = user.uid;
      
      // 1. Delete price alerts (Client allowed by rules)
      try {
        const alertsQuery = query(collection(db, 'priceAlerts'), where('userId', '==', uid));
        const alertsSnapshot = await getDocs(alertsQuery);
        const batch = writeBatch(db);
        alertsSnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error("Failed to delete price alerts:", e);
      }
      
      // 2. Delete wishlist (Client allowed by rules)
      try {
        await deleteDoc(doc(db, 'wishlists', uid));
      } catch (e) {
        console.error("Failed to delete wishlist:", e);
      }

      // 3. Trigger backend cleanup for immutable data (users profile and securityEvents)
      try {
        const idToken = await getIdToken(user, true);
        await fetch('/api/delete-account-cleanup', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      } catch (e) {
        console.error("Backend cleanup failed, continuing to auth deletion", e);
      }

      // 4. Finally, delete the Auth account itself
      try {
        await deleteUser(user);
        this.currentUser = null;
        notifyChange();
        return { success: true, message: 'Account deleted successfully' };
      } catch (e: any) {
        if (e.code === 'auth/requires-recent-login') {
          return { success: false, message: 'Please re-authenticate to confirm deletion.', requiresReauth: true };
        }
        throw e;
      }
      
    } catch (e: any) {
      console.error("Delete Account Error:", e);
      return { success: false, message: e.message || 'Failed to delete account' };
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ auth }) => {
        import('firebase/auth').then(({ signOut }) => {
          signOut(auth).catch(console.error);
        });
      });
    }
    this.currentUser = null;
    notifyChange();
  }

  updateUserRole(userId: string, newRole: UserRole): boolean {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    this.users[idx] = { ...this.users[idx], role: newRole };
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.role = newRole;
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }
    
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          updateDoc(doc(db, 'users', userId), { role: newRole }).catch(console.error);
        });
      });
    }

    saveToStorage(STORAGE_KEYS.USERS, this.users);
    notifyChange();
    return true;
  }

  // --- WISHLIST ---
  getWishlist(): ProductWithPrices[] {
    return this.wishlist
      .map((id) => this.getProductWithPrices(id))
      .filter((p): p is ProductWithPrices => p !== undefined);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist.includes(productId);
  }
  toggleWishlist(productId: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter((id) => id !== productId);
    } else {
      this.wishlist.push(productId);
    }
    
    // Save to Firebase
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'wishlists', this.currentUser!.id), {
            productIds: this.wishlist
          }, { merge: true }).catch(console.error);
        });
      });
    }
    
    notifyChange();
    return this.isInWishlist(productId);
  }


  // --- COMPARE (Max 4) ---
  getCompareList(): ProductWithPrices[] {
    return this.compareIds
      .map((id) => this.getProductWithPrices(id))
      .filter((p): p is ProductWithPrices => p !== undefined);
  }

  isInCompare(productId: string): boolean {
    return this.compareIds.includes(productId);
  }

  addToCompare(productId: string): boolean {
    if (this.compareIds.includes(productId)) return true;
    if (this.compareIds.length >= 4) {
      return false; // Full
    }
    this.compareIds.push(productId);
    saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);
    notifyChange();
    return true;
  }

  removeFromCompare(productId: string): void {
    this.compareIds = this.compareIds.filter((id) => id !== productId);
    saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);
    notifyChange();
  }

  clearCompare(): void {
    this.compareIds = [];
    saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);
    notifyChange();
  }

  // --- AFFILIATE CLICK TRACKING ---
  trackAffiliateClick(
    productId: string,
    storeId: string,
    price: number,
    affiliateUrl: string
  ): AffiliateClick {
    const product = this.getProductById(productId);
    const store = this.getStoreById(storeId);
    const click: any = {
      id: `click-${Date.now()}`,
      productId,
      productName: product ? product.name : 'Unknown Product',
      storeId,
      storeName: store ? store.name : 'Store',
      price,
      affiliateUrl,
      timestamp: new Date().toISOString(),
      device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Web',
    };
    if (this.currentUser) {
      click.userId = this.currentUser.id;
    }
    this.clicks.unshift(click as AffiliateClick);
    if (this.clicks.length > 500) this.clicks = this.clicks.slice(0, 500); // keep recent
    
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'clicks', click.id), click).catch(console.error);
        });
      });
    }
    saveToStorage(STORAGE_KEYS.CLICKS, this.clicks);
    
    notifyChange();
    return click;
  }

  getAffiliateClicks(): AffiliateClick[] {
    return [...this.clicks];
  }

  // --- PRICE HISTORY ---
  async getPriceHistory(productId: string): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'priceHistory'), where('productId', '==', productId), orderBy('recordedAt', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error("Error fetching price history:", e);
      return [];
    }
  }

  async addPriceHistory(history: any): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'priceHistory', history.id), history);
    } catch (e) {
      console.error("Error adding price history:", e);
    }
  }

  // --- RESET TO DEFAULTS ---
  resetToDefaults(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.STORES);
      localStorage.removeItem(STORAGE_KEYS.OFFERS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.WISHLIST);
      localStorage.removeItem(STORAGE_KEYS.COMPARE);
      localStorage.removeItem(STORAGE_KEYS.CLICKS);
    }
    this.init();
    notifyChange();
  }



  // --- SECURITY EVENTS ---
  async logSecurityEvent(userId: string, eventType: 'login' | 'logout' | 'password_reset' | 'account_creation' | 'failed_login', details?: any) {
    if (typeof window === 'undefined') return;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      const eventId = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'securityEvents', eventId), {
        id: eventId,
        userId,
        eventType,
        details: details || null,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to log security event", e);
    }
  }

  // --- PRICE ALERTS ---
  async getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'priceAlerts'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PriceAlert);
    } catch (e) {
      console.error("Error fetching price alerts:", e);
      return [];
    }
  }

  async addPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<PriceAlert | undefined> {
    if (typeof window === 'undefined') return undefined;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const now = new Date().toISOString();
      const newAlert: PriceAlert = {
        ...alert,
        id: `alert-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      
      await setDoc(doc(db, 'priceAlerts', newAlert.id), newAlert);
      return newAlert;
    } catch (e) {
      console.error("Error adding price alert:", e);
      return undefined;
    }
  }

  async updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const updatePayload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'priceAlerts', id), updatePayload);
      return true;
    } catch (e) {
      console.error("Error updating price alert:", e);
      return false;
    }
  }

  async deletePriceAlert(id: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      await deleteDoc(doc(db, 'priceAlerts', id));
      return true;
    } catch (e) {
      console.error("Error deleting price alert:", e);
      return false;
    }
  }

}

export const findoraStore = new FindoraStore();

// React hook for observing changes to the store
export function useFindoraStore() {
  useSyncExternalStore(
    (listener) => {
      window.addEventListener(EVENT_NAME, listener);
      return () => window.removeEventListener(EVENT_NAME, listener);
    },
    () => storeVersion
  );
  return findoraStore;
}
