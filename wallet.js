class PhantomWallet {
    constructor() {
        this.wallet = null;
        this.connected = false;
        this.publicKey = null;
        this.address = null;
        this.listeners = [];

        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.getBalance = this.getBalance.bind(this);
        this.signTransaction = this.signTransaction.bind(this);
        this.signAllTransactions = this.signAllTransactions.bind(this);
    }

    /**
     * Initialize wallet connection
     */
    async initialize() {
        try {
            if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
                this.wallet = window.solana;
                // console.log('Phantom wallet detected');

                if (this.wallet.isConnected) {
                    this.connected = true;
                    this.publicKey = this.wallet.publicKey;
                    this.address = this.publicKey.toString();
                    // console.log('Wallet already connected:', this.address);
                }

                this.setupEventListeners();
                
                return true;
            } else {
                console.warn('Phantom wallet not detected');
                return false;
            }
        } catch (error) {
            console.error('Error initializing wallet:', error);
            return false;
        }
    }

    /**
     * Set up wallet event listeners
     */
    setupEventListeners() {
        if (!this.wallet) return;

        this.wallet.on('accountChanged', (publicKey) => {
            // console.log('Account changed:', publicKey);
            if (publicKey) {
                this.publicKey = publicKey;
                this.address = publicKey.toString();
                this.connected = true;
            } else {
                this.connected = false;
                this.publicKey = null;
                this.address = null;
            }
            this.notifyListeners();
        });

        this.wallet.on('disconnect', () => {
            // console.log('Wallet disconnected');
            this.connected = false;
            this.publicKey = null;
            this.address = null;
            this.notifyListeners();
        });
    }

    /**
     * Connect to Phantom wallet
     */
    async connect() {
        try {
            if (!this.wallet) {
                throw new Error('Phantom wallet not detected. Please install Phantom wallet.');
            }

            // console.log('Connecting to Phantom wallet...');

            const response = await this.wallet.connect();
            
            if (response && response.publicKey) {
                this.connected = true;
                this.publicKey = response.publicKey;
                this.address = response.publicKey.toString();
                
                // console.log('Wallet connected successfully:', this.address);
                this.notifyListeners();
                
                return {
                    success: true,
                    publicKey: this.publicKey,
                    address: this.address
                };
            } else {
                throw new Error('Connection was rejected or failed');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.connected = false;
            this.publicKey = null;
            this.address = null;
            this.notifyListeners();
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Disconnect from Phantom wallet
     */
    async disconnect() {
        try {
            if (!this.wallet) {
                throw new Error('No wallet connected');
            }

            // console.log('Disconnecting wallet...');
            
            // Request disconnection
            await this.wallet.disconnect();
            
            this.connected = false;
            this.publicKey = null;
            this.address = null;
            
            // console.log('Wallet disconnected successfully');
            this.notifyListeners();
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Wallet disconnection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get wallet balance
     */
    async getBalance() {
        try {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }

            // This would typically use Solana Web3.js to get balance
            // For now, return a placeholder
            return {
                success: true,
                balance: 0, // Placeholder
                sol: 0
            };
        } catch (error) {
            console.error('Error getting balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sign a transaction
     */
    async signTransaction(transaction) {
        if (!this.connected || !this.wallet) throw new Error('Wallet not connected');
        const signedTransaction = await this.wallet.signTransaction(transaction);
        return signedTransaction;
    }

    /**
     * Sign multiple transactions
     */
    async signAllTransactions(transactions) {
        if (!this.connected || !this.wallet) throw new Error('Wallet not connected');
        const signedTransactions = await this.wallet.signAllTransactions(transactions);
        return signedTransactions;
    }

    /**
     * Get wallet status
     */
    getStatus() {
        return {
            connected: this.connected,
            publicKey: this.publicKey,
            address: this.address,
            wallet: this.wallet ? 'Phantom' : null
        };
    }

    /**
     * Format address for display
     */
    formatAddress(address = this.address, length = 4) {
        if (!address) return '';
        if (address.length <= length * 2) return address;
        return `${address.slice(0, length)}...${address.slice(-length)}`;
    }

    /**
     * Add event listener
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove event listener
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    /**
     * Notify all listeners of state changes
     */
    notifyListeners() {
        const status = this.getStatus();
        this.listeners.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in wallet listener:', error);
            }
        });
    }

    /**
     * Check if wallet is available
     */
    isAvailable() {
        return typeof window !== 'undefined' && window.solana && window.solana.isPhantom;
    }

    /**
     * Get installation URL
     */
    getInstallUrl() {
        return 'https://phantom.app/';
    }
}

// Create singleton instance
const phantomWallet = new PhantomWallet();

// Make it available globally
window.phantomWallet = phantomWallet;
window.PhantomWallet = PhantomWallet;
