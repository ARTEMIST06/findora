import re

with open('src/pages/public/ProfilePage.tsx', 'r') as f:
    code = f.read()

imports_old = """import { Shield, Package, LogOut, Check, Heart, ExternalLink, Activity, Bell, Trash2 } from 'lucide-react';
import { useToast } from '../../components/Toast';"""

imports_new = """import { Shield, Package, LogOut, Check, Heart, ExternalLink, Activity, Bell, Trash2, AlertTriangle, Key } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { auth } from '../../lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';"""

code = code.replace(imports_old, imports_new)

state_old = """  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);"""

state_new = """  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Account Deletion State
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthMode, setReauthMode] = useState<'password' | 'google' | null>(null);"""

code = code.replace(state_old, state_new)

hooks_old = """  const handleLogout = () => {
    store.logout();
    onNavigate('home');
    showToast({ title: "Logged out", message: "You have been logged out safely.", type: "info" });
  };"""

hooks_new = """  const handleLogout = () => {
    store.logout();
    onNavigate('home');
    showToast({ title: "Logged out", message: "You have been logged out safely.", type: "info" });
  };

  const handleInitiateDelete = () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Determine provider
    const provider = user.providerData[0]?.providerId;
    if (provider === 'password') {
      setReauthMode('password');
    } else if (provider === 'google.com') {
      setReauthMode('google');
    } else {
      setReauthMode(null); // Fallback if no provider
    }
    
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    setIsDeletingAccount(true);
    const result = await store.deleteAccount();
    if (result.success) {
      showToast({ title: "Account Deleted", message: "Your account and private data have been permanently removed.", type: "success" });
      onNavigate('home');
    } else if (result.requiresReauth) {
      showToast({ title: "Session Expired", message: "Please re-authenticate to confirm deletion.", type: "error" });
      setShowDeleteConfirm(true);
      setIsDeletingAccount(false);
    } else {
      showToast({ title: "Error", message: result.message, type: "error" });
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const confirmDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      setIsDeletingAccount(true);
      if (reauthMode === 'password') {
        if (!reauthPassword) {
          showToast({ title: "Error", message: "Password required to delete account.", type: "error" });
          setIsDeletingAccount(false);
          return;
        }
        if (!user.email) return;
        const credential = EmailAuthProvider.credential(user.email, reauthPassword);
        await reauthenticateWithCredential(user, credential);
      } else if (reauthMode === 'google') {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      }
      
      await performDelete();
    } catch (e: any) {
      console.error(e);
      showToast({ title: "Authentication Failed", message: "Could not verify your identity. " + (e.message || ""), type: "error" });
      setIsDeletingAccount(false);
    }
  };
"""

code = code.replace(hooks_old, hooks_new)

render_old = """      <div className="mt-8 pt-8 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>"""

render_new = """      <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex-1 max-w-lg">
          <h3 className="text-red-800 font-semibold mb-1 flex items-center gap-2">
            <AlertTriangle size={18} />
            Danger Zone
          </h3>
          <p className="text-sm text-red-600/80 mb-4">
            Permanently delete your Findora account, active price alerts, saved items, and personal data. This action cannot be undone. Public reviews or shared deals may be retained anonymously.
          </p>
          <button
            onClick={handleInitiateDelete}
            disabled={isDeletingAccount}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 rounded-lg transition-all font-medium text-sm disabled:opacity-50"
          >
            {isDeletingAccount ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-slate-600 mb-6">
              This action is <span className="font-semibold text-red-600">permanent</span>. All your saved items, price alerts, and personal preferences will be erased.
            </p>

            {reauthMode === 'password' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verify your password
                </label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteConfirm(false); setReauthPassword(""); }}
                disabled={isDeletingAccount}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isDeletingAccount || (reauthMode === 'password' && !reauthPassword)}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {reauthMode === 'google' ? 'Re-authenticate & Delete' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
"""

code = code.replace(render_old, render_new)

with open('src/pages/public/ProfilePage.tsx', 'w') as f:
    f.write(code)
print("Patched ProfilePage.tsx")
