import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

# We need to add a check inside updatePriceOffer when price drops
trigger_logic = """
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
"""

if "// Check price alerts" not in code:
    code = code.replace("updateDoc(doc(db, 'offers', id), updatePayload).catch(console.error);", trigger_logic)
    with open('src/services/store.ts', 'w') as f:
        f.write(code)
    print("Added alert trigger logic")
else:
    print("Already there")
