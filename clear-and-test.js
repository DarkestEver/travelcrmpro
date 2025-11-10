// Clear localStorage and test login
// Run this in browser console (F12)

console.log('🔍 Checking current auth state...');
const authData = localStorage.getItem('auth-storage');
console.log('Current auth:', authData);

console.log('\n🧹 Clearing all storage...');
localStorage.clear();
sessionStorage.clear();

console.log('✅ Storage cleared!');
console.log('📍 Current URL:', window.location.href);

if (window.location.pathname !== '/login') {
  console.log('🔄 Redirecting to login...');
  window.location.href = '/login';
} else {
  console.log('✅ Already on login page');
  console.log('🔄 Reloading page...');
  window.location.reload();
}

console.log('\n✅ Ready to test!');
console.log('📧 Use: supplier@travelcrm.com');
console.log('🔑 Password: Supplier@123');
