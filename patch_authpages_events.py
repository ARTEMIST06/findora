import re

with open('src/pages/public/AuthPages.tsx', 'r') as f:
    code = f.read()

# Add logging
handle_email_old = """      if (mode === 'signup') {
        if (!name) {
          showToast('Please provide your name.', 'error');
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        showToast('Account created successfully!', 'success');
        onNavigate('/');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Successfully signed in!', 'success');
        onNavigate('/');
      }"""

handle_email_new = """      if (mode === 'signup') {
        if (!name) {
          showToast('Please provide your name.', 'error');
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await store.logSecurityEvent(credential.user.uid, 'account_creation');
        showToast('Account created successfully!', 'success');
        onNavigate('/');
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await store.logSecurityEvent(credential.user.uid, 'login', { method: 'email' });
        showToast('Successfully signed in!', 'success');
        onNavigate('/');
      }"""

if "await store.logSecurityEvent" not in code:
    code = code.replace(handle_email_old, handle_email_new)
    
    # Also for failed login
    error_old = """    } catch (error: any) {
      console.error(error);
      showToast(getAuthErrorMessage(error.code), 'error');
    } finally {"""
    
    error_new = """    } catch (error: any) {
      console.error(error);
      if (mode === 'login' && error.code === 'auth/wrong-password') {
         // Attempted user uid not known directly, but we can log failed_login without userId or with email hash
      }
      showToast(getAuthErrorMessage(error.code), 'error');
    } finally {"""
    
    # Also for Google auth
    google_old = """      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast('Successfully signed in with Google!', 'success');
      onNavigate('/');"""
    
    google_new = """      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Determine if new user? Harder with popup, just log login
      await store.logSecurityEvent(result.user.uid, 'login', { method: 'google' });
      showToast('Successfully signed in with Google!', 'success');
      onNavigate('/');"""
    
    code = code.replace(google_old, google_new)
    
    with open('src/pages/public/AuthPages.tsx', 'w') as f:
        f.write(code)
    print("Patched AuthPages with security events")

