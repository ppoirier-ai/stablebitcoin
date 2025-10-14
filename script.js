// Oracle module is loaded via script tag in HTML
// Wallet module is loaded via script tag in HTML

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const swapTokensBtn = document.getElementById('swapTokens');
const fromAmountInput = document.getElementById('fromAmount');
const toAmountInput = document.getElementById('toAmount');
const swapSubmitBtn = document.getElementById('swapSubmit');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const maxBtn = document.getElementById("maxBtn");

// Price display elements
const sbtcPriceElement = document.querySelector('.stat-number');

// Oracle state
let currentSBTCPrice = 0;
let currentBTCPrice = 0;
let isOracleConnected = false;

// Wallet state
let isWalletConnected = false;
let walletAddress = null;

// Swap functionality
let isSwapped = false;
let cachedBalances = { sbtc: 0, zbtc: 0 };


// Wallet Integration Functions
async function initializeWallet() {
    try {
        console.log('Initializing wallet...');
        const success = await phantomWallet.initialize();
        
        if (success) {
            console.log('Wallet initialized successfully');
            
            // Add wallet state listener
            phantomWallet.addListener(handleWalletStateChange);
            
            // Update UI based on current state
            updateWalletUI();
        } else {
            console.warn('Wallet not available');
            updateWalletUI();
        }
    } catch (error) {
        console.error('Wallet initialization failed:', error);
        updateWalletUI();
    }
}

function handleWalletStateChange(status) {
    console.log('Wallet state changed:', status);
    isWalletConnected = status.connected;
    walletAddress = status.address;
    updateWalletUI();

    // Initialize program when wallet connects
    if (status.connected) {
        initializeSwapProgram();
    }
}

function updateWalletUI() {
    if (!connectWalletBtn) return;
    
    const status = phantomWallet.getStatus();
    
    if (status.connected && status.address) {
        // Wallet is connected
        connectWalletBtn.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>${phantomWallet.formatAddress(status.address)}</span>
        `;
        connectWalletBtn.classList.add('connected');
        connectWalletBtn.onclick = handleDisconnectWallet;
        
        showNotification(`Wallet connected: ${phantomWallet.formatAddress(status.address)}`, 'success');
    } else if (phantomWallet.isAvailable()) {
        // Wallet is available but not connected
        connectWalletBtn.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>Connect Wallet</span>
        `;
        connectWalletBtn.classList.remove('connected');
        connectWalletBtn.onclick = handleConnectWallet;
    } else {
        // Wallet not available
        connectWalletBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install Phantom</span>
        `;
        connectWalletBtn.classList.remove('connected');
        connectWalletBtn.onclick = handleInstallWallet;
    }
}

// Initialize swap program when wallet connects
async function initializeSwapProgram() {
    try {
        await otcSwapProgram.initialize();
        await updateRealBalances();
        showNotification('Swap program connected!', 'success');
    } catch (error) {
        console.error('Failed to initialize swap program:', error);
        showNotification('Swap program not available', 'error');
    }
}

async function handleConnectWallet() {
    try {
        setWalletButtonLoading(true);
        
        const result = await phantomWallet.connect();
        
        if (result.success) {
            showNotification('Wallet connected successfully!', 'success');
        } else {
            showNotification(`Connection failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('Wallet connection failed', 'error');
    } finally {
        setWalletButtonLoading(false);
    }
}

async function handleDisconnectWallet() {
    try {
        setWalletButtonLoading(true);
        
        const result = await phantomWallet.disconnect();
        
        if (result.success) {
            showNotification('Wallet disconnected successfully', 'info');
        } else {
            showNotification(`Disconnect failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Wallet disconnection error:', error);
        showNotification('Wallet disconnection failed', 'error');
    } finally {
        setWalletButtonLoading(false);
    }
}

function handleInstallWallet() {
    const installUrl = phantomWallet.getInstallUrl();
    window.open(installUrl, '_blank');
    showNotification('Please install Phantom wallet and refresh the page', 'info');
}

function setWalletButtonLoading(loading) {
    if (!connectWalletBtn) return;
    
    if (loading) {
        connectWalletBtn.disabled = true;
        connectWalletBtn.innerHTML = `
            <i class="fas fa-spinner spinner"></i>
            <span>Loading...</span>
        `;
    } else {
        connectWalletBtn.disabled = false;
        updateWalletUI();
    }
}

// Oracle Integration Functions
async function initializeOracle() {
    try {
        showNotification('Connecting to Oracle...', 'info');
        
        // Initialize Oracle connection
        await oracle.initialize();
        isOracleConnected = true;
        
        // Fetch initial price data
        await updatePriceData();
        
        showNotification('Oracle connected successfully!', 'success');
        
        // Set up periodic price updates
        setInterval(updatePriceData, 30000); // Update every 30 seconds
        
    } catch (error) {
        console.error('Oracle initialization failed:', error);
        showNotification('Failed to connect to Oracle. Using fallback data.', 'error');
        isOracleConnected = false;
        
        // Use fallback price data
        updatePriceTicker();
    }
}

async function updatePriceData() {
    if (!isOracleConnected) {
        return;
    }

    try {
        const priceData = await oracle.getPriceData();
        
        if (priceData.success && priceData.data) {
            const { sbtc, btc } = priceData.data;
            
            if (sbtc && btc) {
                currentSBTCPrice = sbtc.sbtc_target_price;
                currentBTCPrice = btc.btc_price;
                
                // Validate price
                const validation = oracle.validatePrice(currentSBTCPrice, currentBTCPrice);
                if (!validation.valid) {
                    console.warn('Price validation failed:', validation.reason);
                    showNotification('Price validation warning: ' + validation.reason, 'error');
                }
                
                // Update UI
                updatePriceDisplay();
                // Update swap details with current prices
                if (fromAmountInput.value && toAmountInput.value) {
                    updateSwapDetails(parseFloat(fromAmountInput.value), parseFloat(toAmountInput.value));
                }
                updateExchangeRateOnly();
            }
        } else {
            console.error('Failed to fetch price data:', priceData.errors);
            showNotification('Failed to fetch latest prices from Oracle', 'error');
        }
    } catch (error) {
        console.error('Error updating price data:', error);
        showNotification('Error updating prices: ' + error.message, 'error');
    }
}

function updatePriceDisplay() {
    if (sbtcPriceElement && currentSBTCPrice > 0) {
        const formattedPrice = oracle.formatPrice(currentSBTCPrice, 2);
        sbtcPriceElement.textContent = `$${formattedPrice}`;
    }
}

// Mobile Navigation Toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

swapTokensBtn.addEventListener('click', () => {
  const fromAmount = fromAmountInput.value;
  const toAmount   = toAmountInput.value;

  // swap amounts
  fromAmountInput.value = toAmount;
  toAmountInput.value   = fromAmount;

  // toggle state
  isSwapped = !isSwapped;

  // update labels and balances
  updateTokenDisplay();
  applyBalancesToUI(); // <-- rebind cached balances to the correct side
  updateExchangeRateOnly();

  // tiny animation
  swapTokensBtn.style.transform = 'rotate(180deg)';
  setTimeout(() => { swapTokensBtn.style.transform = 'rotate(0deg)'; }, 300);
});

// Update token display based on swap state
function updateTokenDisplay() {
    const fromTokenSymbol = document.querySelector('#fromAmount').parentElement.querySelector('.token-symbol');
    const toTokenSymbol = document.querySelector('#toAmount').parentElement.querySelector('.token-symbol');

    const fromTokenLogo = document.querySelector('#fromAmount').parentElement.querySelector('.token-logo');
    const toTokenLogo = document.querySelector('#toAmount').parentElement.querySelector('.token-logo');
    
    if (isSwapped) {
        fromTokenSymbol.textContent = 'SBTC';
        fromTokenLogo.innerHTML = `<img src="public/SBTC Icon.png" alt="SBTC" class="token-icon-small">`;

        toTokenSymbol.textContent = 'zBTC';
        toTokenLogo.innerHTML = `<i class="fab fa-bitcoin"></i>`;
    } else {
        fromTokenSymbol.textContent = 'zBTC';
        fromTokenLogo.innerHTML = `<i class="fab fa-bitcoin"></i>`;

        toTokenSymbol.textContent = 'SBTC';
        toTokenLogo.innerHTML = `<img src="public/SBTC Icon.png" alt="SBTC" class="token-icon-small">`;
    }
}

// MAX button logic
document.getElementById("maxBtn").addEventListener("click", () => {
    if (!cachedBalances) return;
    if (!isSwapped) {
        // zBTC → SBTC
        fromAmountInput.value = cachedBalances.zbtc.toFixed(8);
    } else {
        // SBTC → zBTC
        fromAmountInput.value = cachedBalances.sbtc.toFixed(8);
    }
    fromAmountInput.dispatchEvent(new Event('input')); // triggers recalculation if needed
});

// Amount input handling
fromAmountInput.addEventListener('input', (e) => {
    const amount = parseFloat(e.target.value) || 0;
    
    if (amount > 0) {
        // Calculate exchange rate based on Oracle prices
        let exchangeRate = 1.0; // Default fallback
        
        if (isOracleConnected && currentSBTCPrice > 0 && currentBTCPrice > 0) {
            // Use real Oracle prices for calculation
            exchangeRate = currentSBTCPrice / currentBTCPrice;
        } else {
            // Show warning if Oracle data is not available
            showNotification('Using estimated exchange rate. Oracle data unavailable.', 'error');
        }
        
        const calculatedAmount = amount * exchangeRate;
        toAmountInput.value = calculatedAmount.toFixed(6);
        
        // Enable swap button
        swapSubmitBtn.disabled = false;
        swapSubmitBtn.style.opacity = '1';
        
        // Update swap details
        updateSwapDetails(amount, calculatedAmount);
    } else {
        toAmountInput.value = '';
        swapSubmitBtn.disabled = true;
        swapSubmitBtn.style.opacity = '0.6';
    }
});

// Update swap details
function updateSwapDetails(fromAmount, toAmount) {
    const exchangeRate = document.querySelector('.detail-row:nth-child(1) span:last-child');
    const minimumReceived = document.querySelector('.detail-row:nth-child(2) span:last-child');
    const priceImpact = document.querySelector('.detail-row:nth-child(3) span:last-child');

    if (exchangeRate) {
        let rate;
        if (isOracleConnected && currentSBTCPrice > 0 && currentBTCPrice > 0) {
            // Use real Oracle exchange rate
            rate = (currentSBTCPrice / currentBTCPrice).toFixed(4);
        } else {
            // Fallback to calculated rate
            rate = (toAmount / fromAmount).toFixed(4);
        }
        exchangeRate.textContent = `1 zBTC = ${rate} SBTC`;
    }
    
    if (minimumReceived) {
        // 0.5% slippage
        const slippage = 0.005;
        const minimum = toAmount * (1 - slippage);
        
        // Format with commas for better readability
        const formattedMinimum = minimum.toLocaleString('en-US', {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6
        });
        
        minimumReceived.textContent = `${formattedMinimum} SBTC`;
    }
    
    if (priceImpact) {
        // Calculate price impact based on Oracle data
        let impact = 0;
        if (isOracleConnected && currentSBTCPrice > 0) {
            // Simulate price impact based on trade size vs Oracle price
            const tradeValue = fromAmount * currentBTCPrice;
            const impactFactor = Math.min(tradeValue / 10000, 0.1); // Max 10% impact
            impact = (impactFactor * 100).toFixed(2);
        } else {
            // Fallback simulation
            impact = (Math.random() * 0.1).toFixed(2);
        }
        
        priceImpact.textContent = `${impact}%`;
        priceImpact.className = parseFloat(impact) < 0.05 ? 'positive' : '';
    }
}

function updateExchangeRateOnly() {
    const exchangeRateField = document.querySelector('.detail-row:nth-child(1) span:last-child');

    if (!exchangeRateField) return;

    if (currentSBTCPrice > 0 && currentBTCPrice > 0) {
        // Calculate true oracle rate
        const rate = (currentSBTCPrice / currentBTCPrice).toFixed(4);

        // Respect token direction (flip if swapped)
        if (!isSwapped) {
            exchangeRateField.textContent = `1 zBTC = ${rate} SBTC`;
        } else {
            const inverseRate = (1 / rate).toFixed(4);
            exchangeRateField.textContent = `1 SBTC = ${inverseRate} zBTC`;
        }
    } else {
        // Show neutral fallback
        exchangeRateField.textContent = isSwapped
            ? `1 SBTC = 1.0000 zBTC`
            : `1 zBTC = 1.0000 SBTC`;
    }
}


// Swap submission
swapSubmitBtn.addEventListener('click', async () => {
    let fromAmount = fromAmountInput.value.trim();

    if (!fromAmount || isNaN(fromAmount) || parseFloat(fromAmount) <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    if (!isWalletConnected) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }

    try {
        // Ensure program is ready
        if (!otcSwapProgram.isInitialized) {
            await otcSwapProgram.initialize();
        }

        // Refresh balances
        await updateRealBalances();

        // Convert to token base units (8 decimals)
        const amount = Math.floor(parseFloat(fromAmount) * 1e8);

        // ✅ Validate balance BEFORE sending tx
        if (!isSwapped) {
            // zBTC → sBTC
            if (cachedBalances.zbtc * 1e8 < amount) {
                showNotification(`Insufficient zBTC balance`, 'error');
                return;
            }
        } else {
            // sBTC → zBTC
            if (cachedBalances.sbtc * 1e8 < amount) {
                showNotification(`Insufficient SBTC balance`, 'error');
                return;
            }
        }

        // Show loading state
        const restoreButton = addLoadingState(swapSubmitBtn, 'Processing...');

        let result;
        if (!isSwapped) {
            // Mint SBTC
            result = await otcSwapProgram.mintSbtc(amount);
        } else {
            // Burn SBTC
            result = await otcSwapProgram.burnSbtc(amount);
        }

        if (result.success) {
            showNotification('✅ Swap completed!', 'success');
            fromAmountInput.value = '';
            toAmountInput.value = '';
            await updateRealBalances();
        } else {
            showNotification(`⚠️ Swap failed: ${result.error}`, 'error');
        }

        restoreButton();

    } catch (err) {
        console.error('Swap error:', err);
        showNotification('Unexpected swap error', 'error');
    }
});


// Fetch fresh balances and apply to the UI based on isSwapped
async function updateRealBalances() {
  if (!otcSwapProgram.isInitialized) return;

  try {
    const balances = await otcSwapProgram.getUserBalances();
    cachedBalances = balances; // keep latest in memory
    applyBalancesToUI();
  } catch (e) {
    console.error('Failed to fetch balances:', e);
  }
}

function applyBalancesToUI() {
  const fromBalEl = document.querySelector('#swap .token-input:first-of-type .balance');
  const toBalEl   = document.querySelector('#swap .token-input:last-of-type .balance');

  if (!fromBalEl || !toBalEl) return;

  if (isSwapped) {
    // From is SBTC, To is zBTC
    fromBalEl.textContent = `Balance: ${cachedBalances.sbtc.toFixed(8)} SBTC`;
    toBalEl.textContent   = `Balance: ${cachedBalances.zbtc.toFixed(8)} zBTC`;
  } else {
    // From is zBTC, To is SBTC
    fromBalEl.textContent = `Balance: ${cachedBalances.zbtc.toFixed(8)} zBTC`;
    toBalEl.textContent   = `Balance: ${cachedBalances.sbtc.toFixed(8)} SBTC`;
  }
}


// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(notificationStyles);

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .feature-item, .swap-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Token balance simulation (would be fetched from blockchain in real app)
function updateTokenBalances() {
    const fromBalance = document.querySelector('#fromAmount').parentElement.querySelector('.balance');
    const toBalance = document.querySelector('#toAmount').parentElement.querySelector('.token-symbol').parentElement.parentElement.querySelector('.balance');
    
    // Simulate random balances
    const zBTCBalance = Math.random() * 10;
    const sBTCBalance = Math.random() * 10;
    
    // Format with commas
    const formattedZBTC = zBTCBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const formattedSBTC = sBTCBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    if (fromBalance) {
        fromBalance.textContent = `Balance: ${formattedZBTC} zBTC`;
    }
    if (toBalance) {
        toBalance.textContent = `Balance: ${formattedSBTC} SBTC`;
    }
}

// Initialize balances on page load
document.addEventListener('DOMContentLoaded', () => {
    updateTokenBalances();
    
    // Initialize Oracle connection
    initializeOracle();
    
    // Initialize wallet connection
    initializeWallet();
});

// Price ticker simulation (fallback when Oracle is not available)
function updatePriceTicker() {
    const priceElement = document.querySelector('.stat-number');
    if (priceElement && !isOracleConnected) {
        // Simulate price fluctuation around $46,257.62 (realistic BTC price)
        const basePrice = 46257.62;
        const fluctuation = (Math.random() - 0.5) * 1000; // ±$500 fluctuation
        const newPrice = basePrice + fluctuation;
        
        // Format with commas
        const formattedPrice = newPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        priceElement.textContent = `$${formattedPrice}`;
    }
}

// Update price every 5 seconds (only if Oracle is not connected)
setInterval(() => {
    if (!isOracleConnected) {
        updatePriceTicker();
    }
}, 5000);

// Add loading states for better UX
function addLoadingState(element, text = 'Loading...') {
    const originalContent = element.innerHTML;
    element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    element.disabled = true;
    
    return () => {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Error handling for swap
function handleSwapError(error) {
    console.error('Swap error:', error);
    showNotification('Swap failed. Please try again.', 'error');
    
    // Reset button state
    swapSubmitBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Swap zBTC for SBTC';
    swapSubmitBtn.disabled = false;
}

// Add error boundary for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showNotification,
        updateTokenBalances,
        updatePriceTicker
    };
}
