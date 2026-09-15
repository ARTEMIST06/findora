import re

with open('server.ts', 'r') as f:
    code = f.read()

# Replace the payload and parsing block
old_payload = """
          const payload = {
            itemIds: [asin],
            itemIdType: "ASIN",
            marketplace: "www.amazon.in",
            partnerTag: partnerTag,
            resources: [
              "ItemInfo.Title",
              "ItemInfo.ByLineInfo",
              "ItemInfo.Classifications",
              "Offers.Listings.Price",
              "Offers.Listings.Availability.Message",
              "Images.Primary.Large"
            ]
          };
"""

new_payload = """
          const payload = {
            itemIds: [asin],
            itemIdType: "ASIN",
            marketplace: "www.amazon.in",
            partnerTag: partnerTag,
            resources: [
              "itemInfo.title",
              "itemInfo.byLineInfo",
              "itemInfo.classifications",
              "offersV2.listings.price",
              "offersV2.listings.availability",
              "images.primary.large"
            ]
          };
"""

code = code.replace(old_payload.strip(), new_payload.strip())

old_parse = """
          const item = apiData.ItemsResult?.Items?.[0];
          if (!item) {
            return res.status(404).json({ success: false, message: "Product not found on Amazon." });
          }

          const title = item.ItemInfo?.Title?.DisplayValue || "";
          const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "";
          const category = item.ItemInfo?.Classifications?.Binding?.DisplayValue || "";
          const images = item.Images?.Primary?.Large?.URL ? [item.Images.Primary.Large.URL] : [];
          
          const listing = item.Offers?.Listings?.[0];
          const price = listing?.Price?.Amount;
          let mrp = listing?.Price?.Savings?.Amount ? price + listing.Price.Savings.Amount : null;
          
          let availabilityMessage = listing?.Availability?.Message || '';
          let availability = 'out_of_stock';
          if (availabilityMessage.toLowerCase().includes('in stock') || price > 0) {
             availability = 'in_stock';
          }

          const affiliateUrl = item.DetailPageURL || "";
"""

new_parse = """
          const item = apiData.itemsResult?.items?.[0] || apiData.ItemsResult?.Items?.[0];
          if (!item) {
            return res.status(404).json({ success: false, message: "Product not found on Amazon." });
          }

          const title = item.itemInfo?.title?.displayValue || item.ItemInfo?.Title?.DisplayValue || "";
          const brand = item.itemInfo?.byLineInfo?.brand?.displayValue || item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "";
          const category = item.itemInfo?.classifications?.binding?.displayValue || item.ItemInfo?.Classifications?.Binding?.DisplayValue || "";
          const images = item.images?.primary?.large?.url ? [item.images.primary.large.url] : (item.Images?.Primary?.Large?.URL ? [item.Images.Primary.Large.URL] : []);
          
          const listing = item.offersV2?.listings?.[0] || item.Offers?.Listings?.[0] || item.offers?.listings?.[0];
          const price = listing?.price?.amount || listing?.Price?.Amount;
          let mrp = listing?.price?.savings?.amount ? price + listing.price.savings.amount : null;
          if (mrp === null && listing?.Price?.Savings?.Amount) mrp = price + listing.Price.Savings.Amount;
          
          let availabilityMessage = listing?.availability?.message || listing?.Availability?.Message || '';
          let availability = 'out_of_stock';
          if (availabilityMessage.toLowerCase().includes('in stock') || price > 0) {
             availability = 'in_stock';
          }

          const affiliateUrl = item.detailPageURL || item.DetailPageURL || "";
"""

code = code.replace(old_parse.strip(), new_parse.strip())

with open('server.ts', 'w') as f:
    f.write(code)

print("done patch server parse")
