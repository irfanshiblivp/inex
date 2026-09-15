/* ==========================================================================
   AEGIS Gateway - Main Controller & Event Dispatcher
   ========================================================================== */

import { initAuthDatabase, verifyCredentials } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Database Engine
  await initAuthDatabase();

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const errorContainer = document.getElementById('errorContainer');
  const errorMessage = document.getElementById('errorMessage');
  const submitLoginBtn = document.getElementById('submitLoginBtn');

  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const flagDisplay = document.getElementById('flagDisplay');
  const loggedInUserVal = document.getElementById('loggedInUserVal');
  const copyFlagBtn = document.getElementById('copyFlagBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Handle Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      errorContainer.classList.add('hidden');

      const userVal = usernameInput.value;
      const passVal = passwordInput.value;

      if (!userVal || !passVal) {
        showError("Please enter both clearance identifier and passphrase.");
        return;
      }

      // Execute SQL Authentication Verification
      const authResult = verifyCredentials(userVal, passVal);

      if (authResult.success) {
        // Successful Authentication -> Reveal Flag & Vault
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');

        if (flagDisplay) flagDisplay.textContent = authResult.flag || 'neelakuzhil';
        if (loggedInUserVal) loggedInUserVal.textContent = authResult.user ? authResult.user.username : userVal;
      } else {
        showError(authResult.message);
      }
    });
  }

  // Display Error Helper
  function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    if (errorContainer) errorContainer.classList.remove('hidden');
  }

  // Copy Flag to Clipboard
  if (copyFlagBtn) {
    copyFlagBtn.addEventListener('click', () => {
      const flagText = flagDisplay.textContent || 'neelakuzhil';
      navigator.clipboard.writeText(flagText).then(() => {
        const origText = copyFlagBtn.innerHTML;
        copyFlagBtn.innerHTML = `✓ Copied!`;
        setTimeout(() => {
          copyFlagBtn.innerHTML = origText;
        }, 2000);
      }).catch(err => {
        console.error("Clipboard copy error:", err);
      });
    });
  }

  // Handle Session Termination / Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      dashboardView.classList.add('hidden');
      loginView.classList.remove('hidden');
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (errorContainer) errorContainer.classList.add('hidden');
    });
  }
});
