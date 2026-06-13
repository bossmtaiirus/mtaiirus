
// global-auth.js — As Multiverse Access Guard
// Include this script at the TOP of every protected page via <script src="global-auth.js"></script>
// It runs immediately, before the page renders anything.

(function() {
  'use strict';
  
  var ACCESS_KEY = 'multiverse_access_expiry';
  var ACCESS_PAGE = 'get-access.html';
  
  function hasAccess() {
    var expiry = localStorage.getItem(ACCESS_KEY);
    var now = Date.now();
    return (expiry && parseInt(expiry, 10) > now);
  }
  
  function enforceAccess(returnUrl) {
    if (!hasAccess()) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.setItem('auth_return_url', returnUrl || window.location.href);
      if (window.location.pathname.indexOf(ACCESS_PAGE) === -1) {
        window.location.href = ACCESS_PAGE;
      }
      return false;
    }
    return true;
  }
  
  // Expose globally
  window.hasAccess = hasAccess;
  window.enforceAccess = enforceAccess;
  
  // Auto-enforce ONLY on player.html
  if (window.location.pathname.indexOf('player.html') !== -1) {
    enforceAccess();
  }
})();
