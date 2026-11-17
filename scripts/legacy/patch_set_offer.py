import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

set_offer_old = """  setOffer(
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
      // New offer
      const newOffer: PriceOffer = {
        id: `offer-${Date.now()}`,
        productId,
        storeId: offerData.storeId,
        price: offerData.price,
        originalPrice: offerData.originalPrice,
        affiliateUrl: offerData.affiliateUrl || '',
        productUrl: offerData.affiliateUrl || '',
        availability: offerData.inStock === false ? 'out_of_stock' : 'in_stock',
        shippingNote: offerData.shippingNote,
        lastUpdated: new Date().toISOString(),
        sourceType: 'manual',
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
  }"""

set_offer_new = """  async setOffer(
    productId: string,
    offerData: {
      storeId: string;
      price: number;
      originalPrice?: number;
      affiliateUrl?: string;
      inStock?: boolean;
      shippingNote?: string;
    }
  ): Promise<PriceOffer> {
    const existingIdx = this.offers.findIndex(
      (o) => o.productId === productId && o.storeId === offerData.storeId
    );

    if (existingIdx !== -1) {
      const offerId = this.offers[existingIdx].id;
      const updated = await this.updatePriceOffer(offerId, {
        price: offerData.price,
        originalPrice: offerData.originalPrice,
        affiliateUrl: offerData.affiliateUrl || this.offers[existingIdx].affiliateUrl,
        availability: offerData.inStock === false ? 'out_of_stock' : 'in_stock',
        shippingNote: offerData.shippingNote,
        sourceType: 'manual',
      });
      return updated || this.offers[existingIdx];
    } else {
      // New offer
      const newOffer = await this.addPriceOffer({
        productId,
        storeId: offerData.storeId,
        price: offerData.price,
        originalPrice: offerData.originalPrice,
        affiliateUrl: offerData.affiliateUrl || '',
        productUrl: offerData.affiliateUrl || '',
        availability: offerData.inStock === false ? 'out_of_stock' : 'in_stock',
        shippingNote: offerData.shippingNote,
        sourceType: 'manual',
      });
      return newOffer;
    }
  }"""

code = code.replace(set_offer_old.strip(), set_offer_new.strip())

with open('src/services/store.ts', 'w') as f:
    f.write(code)

print("done patching setOffer")
