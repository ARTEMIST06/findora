import re

with open('src/pages/public/ProductDetailPage.tsx', 'r') as f:
    code = f.read()

# 1. Add currentUser and state
state_old = """  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);"""

state_new = """  const currentUser = store.getCurrentUser();
  const [targetPrice, setTargetPrice] = useState('');
  const [isSettingAlert, setIsSettingAlert] = useState(false);
  const [existingAlert, setExistingAlert] = useState<any>(null);

  useEffect(() => {
    if (currentUser && product) {
       store.getPriceAlerts(currentUser.id).then(alerts => {
           const alertForProd = alerts.find(a => a.productId === product.id && a.isActive);
           if (alertForProd) {
               setExistingAlert(alertForProd);
               setTargetPrice(alertForProd.targetPrice.toString());
           }
       });
    }
  }, [currentUser, product?.id]);"""

if "const [targetPrice" not in code:
    code = code.replace(state_old, state_new)

# 2. Add handlePriceAlertSubmit logic
handle_old = """  const handlePriceAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (priceAlertEmail && priceAlertEmail.includes('@')) {
      setAlertSubmitted(true);
      showToast(`Price alert created! We will email ${priceAlertEmail} if price drops further.`, 'success');
    }
  };"""

handle_new = """  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to set a price alert.', 'error');
      return;
    }
    const target = parseFloat(targetPrice);
    if (isNaN(target) || target <= 0) {
      showToast('Please enter a valid target price greater than 0.', 'error');
      return;
    }
    const bestOffer = product?.offers[0];
    if (!bestOffer) return;

    setIsSettingAlert(true);
    try {
      if (existingAlert) {
         await store.updatePriceAlert(existingAlert.id, { targetPrice: target, isActive: true });
         setExistingAlert({ ...existingAlert, targetPrice: target, isActive: true });
         showToast(`Alert updated! We will notify you when the price drops below ₹${target}.`, 'success');
      } else {
         const newAlert = await store.addPriceAlert({
           userId: currentUser.id,
           productId: product!.id,
           offerId: bestOffer.id,
           targetPrice: target,
           currency: bestOffer.currency,
           isActive: true,
         });
         if (newAlert) {
           setExistingAlert(newAlert);
           showToast(`Alert created! We will notify you when the price drops below ₹${target}.`, 'success');
         } else {
           showToast('Failed to create price alert.', 'error');
         }
      }
    } catch (e) {
      showToast('An error occurred while setting the alert.', 'error');
    }
    setIsSettingAlert(false);
  };"""

if "const target = parseFloat(targetPrice);" not in code:
    code = code.replace(handle_old, handle_new)


# 3. Update the UI
ui_old = """              {/* Price Alert Signup */}
              <div className="flex items-center gap-2">
                {alertSubmitted ? (
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✓ Price drop alert registered!
                  </div>
                ) : (
                  <form onSubmit={handlePriceAlertSubmit} className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      value={priceAlertEmail}
                      onChange={(e) => setPriceAlertEmail(e.target.value)}
                      placeholder="Notify when price drops..."
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 shrink-0"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Set Alert</span>
                    </button>
                  </form>
                )}
              </div>"""

ui_new = """              {/* Price Alert Signup */}
              <div className="flex items-center gap-2">
                {!currentUser ? (
                  <button
                    onClick={() => showToast('Please sign in to set price alerts.', 'error')}
                    className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold hover:bg-slate-200 flex items-center gap-1 shrink-0"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Sign in for Alerts</span>
                  </button>
                ) : (
                  <form onSubmit={handlePriceAlertSubmit} className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Target price..."
                        className="pl-6 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 w-32"
                        disabled={isSettingAlert}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSettingAlert}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      {isSettingAlert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                      <span>{existingAlert ? 'Update Alert' : 'Set Alert'}</span>
                    </button>
                  </form>
                )}
              </div>"""

if "disabled={isSettingAlert}" not in code:
    code = code.replace(ui_old, ui_new)
    
with open('src/pages/public/ProductDetailPage.tsx', 'w') as f:
    f.write(code)

print("Patched ProductDetailPage UI")
