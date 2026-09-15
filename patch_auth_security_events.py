import re

with open('src/services/store.ts', 'r') as f:
    code = f.read()

events_logic = """
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
"""

if "// --- SECURITY EVENTS ---" not in code:
    code = code.replace("  // --- PRICE ALERTS ---", events_logic + "\n  // --- PRICE ALERTS ---")
    with open('src/services/store.ts', 'w') as f:
        f.write(code)
    print("Added logSecurityEvent")
else:
    print("Already there")
