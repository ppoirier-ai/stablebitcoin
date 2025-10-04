// Oracle module is loaded via script tag in HTML

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const swapTokensBtn = document.getElementById('swapTokens');
const fromAmountInput = document.getElementById('fromAmount');
const toAmountInput = document.getElementById('toAmount');
const swapSubmitBtn = document.getElementById('swapSubmit');
const connectWalletBtn = document.querySelector('.connect-wallet-btn');

// Price display elements
const sbtcPriceElement = document.querySelector('.stat-number');

// Oracle state
let currentSBTCPrice = 0;
let currentBTCPrice = 0;
let isOracleConnected = false;

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

// Swap functionality
let isSwapped = false;

// Swap tokens button functionality
swapTokensBtn.addEventListener('click', () => {
    const fromAmount = fromAmountInput.value;
    const toAmount = toAmountInput.value;
    
    // Swap the values
    fromAmountInput.value = toAmount;
    toAmountInput.value = fromAmount;
    
    // Toggle swap state
    isSwapped = !isSwapped;
    
    // Update token symbols (this would be more complex in a real app)
    updateTokenDisplay();
    
    // Animate the swap button
    swapTokensBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapTokensBtn.style.transform = 'rotate(0deg)';
    }, 300);
});

// Update token display based on swap state
function updateTokenDisplay() {
    const fromTokenSymbol = document.querySelector('#fromAmount').parentElement.querySelector('.token-symbol');
    const toTokenSymbol = document.querySelector('#toAmount').parentElement.querySelector('.token-symbol');
    
    if (isSwapped) {
        fromTokenSymbol.textContent = 'SBTC';
        toTokenSymbol.textContent = 'zBTC';
    } else {
        fromTokenSymbol.textContent = 'zBTC';
        toTokenSymbol.textContent = 'SBTC';
    }
}

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
        minimumReceived.textContent = `${minimum.toFixed(6)} SBTC`;
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

// Swap submission
swapSubmitBtn.addEventListener('click', () => {
    const fromAmount = fromAmountInput.value;
    const toAmount = toAmountInput.value;
    
    if (!fromAmount || !toAmount) {
        showNotification('Please enter amounts to swap', 'error');
        return;
    }
    
    // Simulate swap process
    swapSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    swapSubmitBtn.disabled = true;
    
    // Simulate API call delay
    setTimeout(() => {
        showNotification('Swap completed successfully!', 'success');
        
        // Reset form
        fromAmountInput.value = '';
        toAmountInput.value = '';
        swapSubmitBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Swap zBTC for SBTC';
        swapSubmitBtn.disabled = true;
        swapSubmitBtn.style.opacity = '0.6';
        
        // Reset swap details
        resetSwapDetails();
    }, 2000);
});

// Reset swap details
function resetSwapDetails() {
    const exchangeRate = document.querySelector('.detail-row:nth-child(1) span:last-child');
    const minimumReceived = document.querySelector('.detail-row:nth-child(2) span:last-child');
    const priceImpact = document.querySelector('.detail-row:nth-child(3) span:last-child');
    
    if (exchangeRate) exchangeRate.textContent = '1 zBTC = 1.00 SBTC';
    if (minimumReceived) minimumReceived.textContent = '0.00 SBTC';
    if (priceImpact) {
        priceImpact.textContent = '0.00%';
        priceImpact.className = 'positive';
    }
}

// Connect wallet functionality
connectWalletBtn.addEventListener('click', () => {
    // Simulate wallet connection
    connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    connectWalletBtn.disabled = true;
    
    setTimeout(() => {
        connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i> 0x1234...5678';
        connectWalletBtn.disabled = false;
        showNotification('Wallet connected successfully!', 'success');
    }, 1500);
});

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
    const zBTCBalance = (Math.random() * 10).toFixed(2);
    const sBTCBalance = (Math.random() * 10).toFixed(2);
    
    if (fromBalance) {
        fromBalance.textContent = `Balance: ${zBTCBalance} zBTC`;
    }
    if (toBalance) {
        toBalance.textContent = `Balance: ${sBTCBalance} SBTC`;
    }
}

// Initialize balances on page load
document.addEventListener('DOMContentLoaded', () => {
    updateTokenBalances();
    
    // Initialize Oracle connection
    initializeOracle();
});

// Price ticker simulation (fallback when Oracle is not available)
function updatePriceTicker() {
    const priceElement = document.querySelector('.stat-number');
    if (priceElement && !isOracleConnected) {
        // Simulate price fluctuation around $46,257.62 (realistic BTC price)
        const basePrice = 46257.62;
        const fluctuation = (Math.random() - 0.5) * 1000; // ±$500 fluctuation
        const newPrice = (basePrice + fluctuation).toFixed(2);
        priceElement.textContent = `$${newPrice}`;
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
