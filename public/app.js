/* ==========================================================================
   LEDGER BANK FRONTEND APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- STATE ---
  let currentUser = JSON.parse(localStorage.getItem('ledger_user')) || null;
  let userAccount = null;

  // --- DOM ELEMENTS ---
  // Portals & Tabs
  const tabUserPortal = document.getElementById('tabUserPortal');
  const tabAdminPortal = document.getElementById('tabAdminPortal');
  const userPortalSection = document.getElementById('userPortalSection');
  const adminPortalSection = document.getElementById('adminPortalSection');

  // Status Bar
  const statusBadge = document.getElementById('statusBadge');
  const btnLogout = document.getElementById('btnLogout');

  // User Auth Forms
  const userAuthContainer = document.getElementById('userAuthContainer');
  const userDashboardContainer = document.getElementById('userDashboardContainer');
  const btnToggleLogin = document.getElementById('btnToggleLogin');
  const btnToggleRegister = document.getElementById('btnToggleRegister');
  const formUserLogin = document.getElementById('formUserLogin');
  const formUserRegister = document.getElementById('formUserRegister');

  // User Dashboard Elements
  const lblAccountNumber = document.getElementById('lblAccountNumber');
  const lblHolderName = document.getElementById('lblHolderName');
  const lblAccountBalance = document.getElementById('lblAccountBalance');
  const lblAccountStatus = document.getElementById('lblAccountStatus');
  const lblPinStatus = document.getElementById('lblPinStatus');
  const lblMemberSince = document.getElementById('lblMemberSince');
  const btnCopyAccount = document.getElementById('btnCopyAccount');
  const btnRefreshLedger = document.getElementById('btnRefreshLedger');
  const tblUserTransactions = document.getElementById('tblUserTransactions');

  // Modals & Buttons
  const btnOpenSendMoneyModal = document.getElementById('btnOpenSendMoneyModal');
  const btnOpenDepositModal = document.getElementById('btnOpenDepositModal');
  const btnOpenPinModal = document.getElementById('btnOpenPinModal');
  const modalSendMoney = document.getElementById('modalSendMoney');
  const modalDeposit = document.getElementById('modalDeposit');
  const modalSetPin = document.getElementById('modalSetPin');

  const btnCloseSendMoney = document.getElementById('btnCloseSendMoney');
  const btnCloseDeposit = document.getElementById('btnCloseDeposit');
  const btnCloseSetPin = document.getElementById('btnCloseSetPin');

  const formSendMoney = document.getElementById('formSendMoney');
  const formDeposit = document.getElementById('formDeposit');
  const formSetPin = document.getElementById('formSetPin');

  // Admin Dashboard Elements
  const statTotalReserve = document.getElementById('statTotalReserve');
  const statCustomerCount = document.getElementById('statCustomerCount');
  const statTxCount = document.getElementById('statTxCount');
  const formAdminOnboard = document.getElementById('formAdminOnboard');
  const formAdminCashOp = document.getElementById('formAdminCashOp');
  const btnCashierDeposit = document.getElementById('btnCashierDeposit');
  const btnCashierWithdraw = document.getElementById('btnCashierWithdraw');
  const btnRefreshAdminAccounts = document.getElementById('btnRefreshAdminAccounts');
  const tblAdminAccounts = document.getElementById('tblAdminAccounts');

  // --- INITIALIZATION ---
  initApp();

  function initApp() {
    setupEventListeners();
    updateUserStatusUI();

    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        switchPortal('ADMIN');
      } else {
        switchPortal('USER');
        loadUserData();
      }
    } else {
      switchPortal('USER');
    }
  }

  // --- NAVIGATION & PORTAL SWITCHING ---
  function switchPortal(portalName) {
    if (portalName === 'ADMIN') {
      tabAdminPortal.classList.add('active');
      tabUserPortal.classList.remove('active');
      adminPortalSection.classList.add('active');
      userPortalSection.classList.remove('active');

      if (currentUser && currentUser.role === 'ADMIN') {
        loadAdminDashboard();
      } else {
        showToast('Please log in with Admin credentials (admin@ledgerbank.com)', 'error');
      }
    } else {
      tabUserPortal.classList.add('active');
      tabAdminPortal.classList.remove('active');
      userPortalSection.classList.add('active');
      adminPortalSection.classList.remove('active');
    }
  }

  function updateUserStatusUI() {
    if (currentUser) {
      statusBadge.className = 'status-badge logged-in';
      statusBadge.innerHTML = `<i class="fa-solid fa-user-check"></i> ${currentUser.name} (${currentUser.role})`;
      btnLogout.classList.remove('hidden');

      userAuthContainer.classList.add('hidden');
      userDashboardContainer.classList.remove('hidden');
    } else {
      statusBadge.className = 'status-badge guest';
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-user"></i> Not Logged In`;
      btnLogout.classList.add('hidden');

      userAuthContainer.classList.remove('hidden');
      userDashboardContainer.classList.add('hidden');
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Portal Tabs
    tabUserPortal.addEventListener('click', () => switchPortal('USER'));
    tabAdminPortal.addEventListener('click', () => switchPortal('ADMIN'));

    // Auth Form Toggle
    btnToggleLogin.addEventListener('click', () => {
      btnToggleLogin.classList.add('active');
      btnToggleRegister.classList.remove('active');
      formUserLogin.classList.remove('hidden');
      formUserRegister.classList.add('hidden');
    });

    btnToggleRegister.addEventListener('click', () => {
      btnToggleRegister.classList.add('active');
      btnToggleLogin.classList.remove('active');
      formUserRegister.classList.remove('hidden');
      formUserLogin.classList.add('hidden');
    });

    // Auth Submits
    formUserLogin.addEventListener('submit', handleLogin);
    formUserRegister.addEventListener('submit', handleRegister);
    btnLogout.addEventListener('click', handleLogout);

    // Dashboard Buttons
    btnCopyAccount.addEventListener('click', () => {
      if (userAccount && userAccount.accountNumber) {
        navigator.clipboard.writeText(userAccount.accountNumber);
        showToast('Account Number copied to clipboard!', 'success');
      }
    });

    btnRefreshLedger.addEventListener('click', loadUserTransactions);

    // Modals Triggers & Close
    btnOpenSendMoneyModal.addEventListener('click', () => modalSendMoney.classList.remove('hidden'));
    btnOpenDepositModal.addEventListener('click', () => modalDeposit.classList.remove('hidden'));
    btnOpenPinModal.addEventListener('click', () => modalSetPin.classList.remove('hidden'));

    btnCloseSendMoney.addEventListener('click', () => modalSendMoney.classList.add('hidden'));
    btnCloseDeposit.addEventListener('click', () => modalDeposit.classList.add('hidden'));
    btnCloseSetPin.addEventListener('click', () => modalSetPin.classList.add('hidden'));

    // Modal Form Submits
    formSendMoney.addEventListener('submit', handleSendMoney);
    formDeposit.addEventListener('submit', handleSelfDeposit);
    formSetPin.addEventListener('submit', handleSetPin);

    // Admin Panel Submits
    formAdminOnboard.addEventListener('submit', handleAdminOnboard);
    btnCashierDeposit.addEventListener('click', () => handleCashierCashOp('DEPOSIT'));
    btnCashierWithdraw.addEventListener('click', () => handleCashierCashOp('WITHDRAW'));
    btnRefreshAdminAccounts.addEventListener('click', loadAdminAccounts);
  }

  // --- API CALL HELPERS ---
  async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (currentUser && currentUser.token) {
      options.headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(endpoint, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API Request Failed');
      }

      return data;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  }

  // --- AUTH HANDLERS ---
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await apiCall('/api/auth/login', 'POST', { email, password });
      currentUser = {
        _id: res.user._id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        hasPin: res.user.hasPin,
        token: res.token
      };

      localStorage.setItem('ledger_user', JSON.stringify(currentUser));
      showToast(`Welcome back, ${currentUser.name}!`, 'success');
      updateUserStatusUI();

      if (currentUser.role === 'ADMIN') {
        switchPortal('ADMIN');
      } else {
        loadUserData();
      }
    } catch (err) { }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
      const res = await apiCall('/api/auth/register', 'POST', { name, email, password });
      currentUser = {
        _id: res.user._id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        hasPin: false,
        token: res.token
      };

      localStorage.setItem('ledger_user', JSON.stringify(currentUser));
      showToast('Registration successful! Opening Bank Account...', 'success');

      // Auto create account after register
      await apiCall('/api/accounts', 'POST');
      updateUserStatusUI();
      loadUserData();
    } catch (err) { }
  }

  function handleLogout() {
    currentUser = null;
    userAccount = null;
    localStorage.removeItem('ledger_user');
    updateUserStatusUI();
    showToast('Logged out successfully', 'success');
  }

  // --- USER DATA & DASHBOARD ---
  async function loadUserData() {
    try {
      const res = await apiCall('/api/accounts', 'GET');
      if (res.accounts && res.accounts.length > 0) {
        userAccount = res.accounts[0];
      } else {
        // Auto create account if none exists
        const createRes = await apiCall('/api/accounts', 'POST');
        userAccount = createRes.account;
        userAccount.balance = 0;
      }

      renderDashboard();
      loadUserTransactions();
    } catch (err) { }
  }

  function renderDashboard() {
    if (!userAccount) return;

    lblAccountNumber.textContent = userAccount.accountNumber || 'ACC---------';
    lblHolderName.textContent = currentUser.name;
    lblAccountBalance.textContent = `₹${Number(userAccount.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    lblAccountStatus.textContent = userAccount.status || 'ACTIVE';

    if (currentUser.hasPin) {
      lblPinStatus.className = 'badge badge-success';
      lblPinStatus.textContent = 'PIN Protected';
    } else {
      lblPinStatus.className = 'badge badge-warning';
      lblPinStatus.textContent = 'PIN Not Set';
    }

    lblMemberSince.textContent = new Date(userAccount.createdAt || Date.now()).toLocaleDateString();
  }

  async function loadUserTransactions() {
    tblUserTransactions.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Loading transactions...</td></tr>`;

    try {
      const res = await apiCall('/api/transactions', 'GET');
      const transactions = res.transactions || [];

      if (transactions.length === 0) {
        tblUserTransactions.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No transactions found in ledger.</td></tr>`;
        return;
      }

      tblUserTransactions.innerHTML = transactions.map(tx => {
        const isDebit = tx.fromAccount && (tx.fromAccount._id === userAccount._id || tx.fromAccount.accountNumber === userAccount.accountNumber);
        const amountClass = isDebit ? 'amount-debit' : 'amount-credit';
        const typeBadge = isDebit ? `<span class="badge badge-danger">DEBIT</span>` : `<span class="badge badge-success">CREDIT</span>`;
        const sign = isDebit ? '-' : '+';

        const fromAccStr = tx.fromAccount ? (tx.fromAccount.accountNumber || tx.fromAccount) : 'N/A';
        const toAccStr = tx.toAccount ? (tx.toAccount.accountNumber || tx.toAccount) : 'N/A';

        return `
          <tr>
            <td>${new Date(tx.createdAt).toLocaleString()}</td>
            <td>${typeBadge}</td>
            <td><code>${fromAccStr}</code></td>
            <td><code>${toAccStr}</code></td>
            <td class="${amountClass}">${sign}₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge badge-success">${tx.status}</span></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tblUserTransactions.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Error loading transactions.</td></tr>`;
    }
  }

  // --- USER ACTIONS ---
  async function handleSendMoney(e) {
    e.preventDefault();
    const toAccount = document.getElementById('transferToAcc').value.trim();
    const amount = Number(document.getElementById('transferAmount').value);
    const transactionPin = document.getElementById('transferPin').value.trim();

    if (!userAccount) return;

    try {
      const body = {
        fromAccount: userAccount.accountNumber,
        toAccount,
        amount,
        transactionPin,
        idempotencyKey: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      };

      await apiCall('/api/transactions', 'POST', body);
      showToast('Money Transferred Successfully!', 'success');
      modalSendMoney.classList.add('hidden');
      formSendMoney.reset();

      loadUserData();
    } catch (err) { }
  }

  async function handleSelfDeposit(e) {
    e.preventDefault();
    const amount = Number(document.getElementById('depositAmount').value);

    if (!userAccount) return;

    try {
      await apiCall('/api/accounts/deposit', 'POST', {
        accountId: userAccount._id,
        amount
      });

      showToast(`Deposited ₹${amount} successfully!`, 'success');
      modalDeposit.classList.add('hidden');
      formDeposit.reset();

      loadUserData();
    } catch (err) { }
  }

  async function handleSetPin(e) {
    e.preventDefault();
    const pin = document.getElementById('newPin').value.trim();

    try {
      await apiCall('/api/auth/set-pin', 'POST', { pin });
      showToast('Transaction PIN saved successfully!', 'success');
      currentUser.hasPin = true;
      localStorage.setItem('ledger_user', JSON.stringify(currentUser));
      modalSetPin.classList.add('hidden');
      formSetPin.reset();

      renderDashboard();
    } catch (err) { }
  }

  // --- ADMIN PORTAL ACTIONS ---
  async function loadAdminDashboard() {
    loadAdminStats();
    loadAdminAccounts();
  }

  async function loadAdminStats() {
    try {
      const res = await apiCall('/api/admin/stats', 'GET');
      statTotalReserve.textContent = `₹${Number(res.totalReserve || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      statCustomerCount.textContent = res.userCount || 0;
      statTxCount.textContent = res.transactionCount || 0;
    } catch (err) { }
  }

  async function loadAdminAccounts() {
    tblAdminAccounts.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Loading registry...</td></tr>`;

    try {
      const res = await apiCall('/api/admin/accounts', 'GET');
      const accounts = res.accounts || [];

      if (accounts.length === 0) {
        tblAdminAccounts.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No customer accounts registered.</td></tr>`;
        return;
      }

      tblAdminAccounts.innerHTML = accounts.map(acc => `
        <tr>
          <td><code>${acc.accountNumber}</code></td>
          <td><strong>${acc.customerName}</strong></td>
          <td>${acc.customerEmail}</td>
          <td><span class="badge badge-success">${acc.status}</span></td>
          <td class="amount-credit">₹${Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td>${new Date(acc.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } catch (err) {
      tblAdminAccounts.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Error loading registry. Ensure you are logged in as Admin.</td></tr>`;
    }
  }

  async function handleAdminOnboard(e) {
    e.preventDefault();
    const name = document.getElementById('adminCustName').value.trim();
    const email = document.getElementById('adminCustEmail').value.trim();
    const password = document.getElementById('adminCustPassword').value.trim();
    const initialDeposit = Number(document.getElementById('adminInitialDeposit').value);

    try {
      const res = await apiCall('/api/admin/onboard-customer', 'POST', {
        name, email, password, initialDeposit
      });

      showToast(`Customer Onboarded! Issued Account: ${res.customer.accountNumber}`, 'success');
      formAdminOnboard.reset();
      loadAdminDashboard();
    } catch (err) { }
  }

  async function handleCashierCashOp(type) {
    const accountNumber = document.getElementById('adminTargetAcc').value.trim();
    const amount = Number(document.getElementById('adminCashAmount').value);

    if (!accountNumber || !amount) {
      showToast('Please enter target Account Number and Amount', 'error');
      return;
    }

    const endpoint = type === 'DEPOSIT' ? '/api/admin/cash-deposit' : '/api/admin/cash-withdraw';

    try {
      const res = await apiCall(endpoint, 'POST', { accountNumber, amount });
      showToast(res.message, 'success');
      formAdminCashOp.reset();
      loadAdminDashboard();
    } catch (err) { }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

});
