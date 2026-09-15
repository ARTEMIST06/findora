import re

with open('src/pages/public/ProfilePage.tsx', 'r') as f:
    code = f.read()

logout_old = """          onClick={() => {
            store.logout();
            showToast('Successfully signed out', 'success');
            onNavigate('/');
          }}"""

logout_new = """          onClick={async () => {
            if (currentUser) await store.logSecurityEvent(currentUser.id, 'logout');
            store.logout();
            showToast('Successfully signed out', 'success');
            onNavigate('/');
          }}"""

if "logSecurityEvent(currentUser.id, 'logout')" not in code:
    code = code.replace(logout_old, logout_new)
    with open('src/pages/public/ProfilePage.tsx', 'w') as f:
        f.write(code)
    print("Patched logout")
