import { useEffect, useState } from 'react';
import {
  Product,
  Store,
  PriceOffer,
  Category,
  User,
  AffiliateClick,
  ProductWithPrices,
  UserRole,
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
function notifyChange() {
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
            if (!snapshot.empty) {
              this.products = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
              notifyChange();
            }
          });

          // Stores listener
          onSnapshot(collection(db, 'stores'), (snapshot) => {
            if (!snapshot.empty) {
              this.stores = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Store));
              notifyChange();
            }
          });

          // Offers listener
          onSnapshot(collection(db, 'offers'), (snapshot) => {
            if (!snapshot.empty) {
              this.offers = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PriceOffer));
              notifyChange();
            }
          });

          // Auth state listener
          let unsubscribeWishlist: (() => void) | null = null;
          
          onAuthStateChanged(auth, async (user) => {
            if (user) {
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                this.currentUser = { ...userSnap.data(), id: userSnap.id } as User;
                // Update lastLogin
                setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true }).catch(console.error);
              } else {
                const newUser: User = {
                  id: user.uid,
                  email: user.email || '',
                  name: user.displayName || user.email?.split('@')[0] || 'User',
                  role: 'shopper',
                  createdAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString(),
                };
                if (user.photoURL) {
                  newUser.avatar = user.photoURL;
                }
                await setDoc(userRef, newUser);
                this.currentUser = newUser;
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
              this.wishlist = getFromStorage(STORAGE_KEYS.WISHLIST, []);
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
    this.wishlist = getFromStorage(STORAGE_KEYS.WISHLIST, []);
    
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
  }

  getProductWithPrices(idOrSlug: string): ProductWithPrices | undefined {
    const product = this.getProductBySlug(idOrSlug) || this.getProductById(idOrSlug);
    if (!product) return undefined;

    const productOffers = this.offers
      .filter((o) => o.productId === product.id)
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
      offers: productOffers,
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

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'products', newProduct.id), newProduct).catch(console.error);
        });
      });
    }
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    notifyChange();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | undefined {
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
      saveToStorage(STORAGE_KEYS.WISHLIST, this.wishlist);
      saveToStorage(STORAGE_KEYS.COMPARE, this.compareIds);
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

  addPriceOffer(offer: Omit<PriceOffer, 'id' | 'lastUpdated'>): PriceOffer {
    const newOffer: PriceOffer = {
      ...offer,
      id: `offer-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
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

  updatePriceOffer(id: string, updates: Partial<PriceOffer>): PriceOffer | undefined {
    const idx = this.offers.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    this.offers[idx] = {
      ...this.offers[idx],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          updateDoc(doc(db, 'offers', id), {
            ...updates,
            lastUpdated: new Date().toISOString(),
          }).catch(console.error);
        });
      });
    }
    saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
    notifyChange();
    return this.offers[idx];
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
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter((id) => id !== productId);
    } else {
      this.wishlist.push(productId);
    }
    
    // Save to Firebase if user is logged in
    if (this.currentUser && typeof window !== 'undefined') {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, 'wishlists', this.currentUser!.id), {
            productIds: this.wishlist
          }, { merge: true }).catch(console.error);
        });
      });
    } else {
      saveToStorage(STORAGE_KEYS.WISHLIST, this.wishlist);
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
  getPriceHistory(productId: string) {
    return INITIAL_PRICE_HISTORY[productId] || [
      { date: 'Jul 2026', price: 99999, storeName: 'Store' },
      { date: 'Aug 2026', price: 95999, storeName: 'Store' },
      { date: 'Sep 2026', price: 92999, storeName: 'Store' },
    ];
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
}

export const findoraStore = new FindoraStore();

// React hook for observing changes to the store
export function useFindoraStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStoreChange = () => setTick((prev) => prev + 1);
    window.addEventListener(EVENT_NAME, handleStoreChange);
    return () => window.removeEventListener(EVENT_NAME, handleStoreChange);
  }, []);

  return findoraStore;
}
