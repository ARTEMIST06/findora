import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

history_methods = """
  async getPriceHistory(productId: string): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'priceHistory'), where('productId', '==', productId), orderBy('recordedAt', 'desc'));
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
"""

if "getPriceHistory" not in code:
    code = code.replace("class FindoraStore {", "class FindoraStore {\n" + history_methods)

# Now, patch addPriceOffer
old_add_offer = """  async addPriceOffer(offer: Omit<PriceOffer, 'id' | 'lastUpdated'>): Promise<PriceOffer> {
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
    }
    saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
    notifyChange();
    return newOffer;
  }"""

new_add_offer = """  async addPriceOffer(offer: Omit<PriceOffer, 'id' | 'lastUpdated'>): Promise<PriceOffer> {
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
  }"""

code = code.replace(old_add_offer.strip(), new_add_offer.strip())

# Now, patch updatePriceOffer
old_update_offer = """  async updatePriceOffer(id: string, updates: Partial<PriceOffer>): Promise<PriceOffer | undefined> {
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
  }"""

new_update_offer = """  async updatePriceOffer(id: string, updates: Partial<PriceOffer>): Promise<PriceOffer | undefined> {
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
  }"""

code = code.replace(old_update_offer.strip(), new_update_offer.strip())

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done patching store with history logic")
