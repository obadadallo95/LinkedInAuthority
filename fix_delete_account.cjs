const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add deleteAccount to imports
if(!code.includes('deleteUser')) {
  code = code.replace(/import { deleteDoc, /g, "import { deleteDoc, getDocs, ");
  code = code.replace(/import { collection, doc, /g, "import { collection, doc, ");
  
  // Also we need deleteUser from firebase/auth
  // wait we can use user.delete() since we have the User object.
}

const deleteAccountFunc = `
  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmMsg = lang === 'ar' 
      ? 'هل أنت متأكد من حذف حسابك بشكل نهائي؟ سيتم مسح جميع منشوراتك وإعداداتك نهائياً ولن تتمكن من التراجع عن هذا الإجراء.' 
      : lang === 'de'
      ? 'Sind Sie sicher, dass Sie Ihr Konto dauerhaft löschen möchten? Alle Daten gehen verloren.'
      : 'Are you sure you want to permanently delete your account? All your data will be lost.';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      // 1. Delete all posts
      const postsRef = collection(db, "users", user.uid, "posts");
      const { getDocs } = await import('firebase/firestore');
      const postsSnap = await getDocs(postsRef);
      const deletePromises = postsSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 2. Delete settings
      const settingsRef = doc(db, "users", user.uid, "settings", "current");
      await deleteDoc(settingsRef);

      // 3. Delete auth account
      await user.delete();
      showToast(lang === 'ar' ? 'تم حذف حسابك بنجاح.' : 'Account deleted successfully.');
      // After user.delete() onAuthStateChanged will fire and set user to null
    } catch (e: any) {
      console.error("Failed to delete account", e);
      if (e.code === 'auth/requires-recent-login') {
        alert(lang === 'ar' ? 'يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى لإتمام عملية الحذف.' : 'Please sign out and sign in again to delete your account.');
      } else {
        showToast(lang === 'ar' ? 'حدث خطأ أثناء الحذف.' : 'Failed to delete account.');
      }
    }
  };

  const handleApplyPresetTime`;

code = code.replace(/const handleApplyPresetTime/g, deleteAccountFunc.trim());

// Pass handleDeleteAccount to SettingsPanel
code = code.replace(/handleDisconnect=\{handleDisconnect\}/g, `handleDisconnect={handleDisconnect}\n                handleDeleteAccount={handleDeleteAccount}`);

fs.writeFileSync('src/App.tsx', code);
