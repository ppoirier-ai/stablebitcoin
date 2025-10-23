const ORACLE_CONFIG = window.ENV.ORACLE_CONFIG;

class BrowserBuffer {
    static from(data, encoding) {
        if (encoding === 'base64') {
            const binaryString = atob(data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }
        throw new Error('Unsupported encoding');
    }
}

class StableBitcoinOracle {
    constructor() {
        this.rpcUrl = ORACLE_CONFIG.RPC_URL;
        this.programId = ORACLE_CONFIG.PROGRAM_ID;
        this.pythPriceFeed = ORACLE_CONFIG.PYTH_PRICE_FEED;
        this.oracleStateAccount = ORACLE_CONFIG.ORACLE_STATE_ACCOUNT;
        this.isInitialized = false;
    }

    /**
     * Initialize the Oracle connection
     */
    async initialize() {
        try {
            // Test connection by getting version
            const response = await this.makeRpcCall('getVersion');
            // console.log('Connected to Solana DevNet:', response);
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Oracle connection:', error);
            throw new Error('Unable to connect to Solana network');
        }
    }

    /**
     * Make RPC call to Solana
     */
    async makeRpcCall(method, params = []) {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: method,
                params: params
            })
        });

        if (!response.ok) {
            throw new Error(`RPC call failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`RPC error: ${data.error.message}`);
        }

        return data.result;
    }

    /**
     * Get account info from Solana
     */
    async getAccountInfo(accountId) {
        try {
            const result = await this.makeRpcCall('getAccountInfo', [
                accountId,
                { encoding: 'base64' }
            ]);
            
            if (!result || !result.value) {
                return null;
            }

            return {
                data: BrowserBuffer.from(result.value.data[0], 'base64'),
                owner: result.value.owner,
                lamports: result.value.lamports,
                executable: result.value.executable
            };
        } catch (error) {
            console.error('Error getting account info:', error);
            return null;
        }
    }

    /**
     * Get current SBTC target price from the Oracle
     */
    async getCurrentSBTCPrice() {
    if (!this.isInitialized) {
        await this.initialize();
    }

    try {
        const accountInfo = await this.getAccountInfo(this.oracleStateAccount);

        if (!accountInfo) {
        console.warn('Oracle state account not found, using simulated price');
        return this.getFallbackSBTCPrice();
        }

        const data = accountInfo.data;
        if (data.length < 24) {
        throw new Error(`Invalid OracleState account size: ${data.length}`);
        }

        const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

        // Anchor discriminator is first 8 bytes
        const sbtcTrendValue = dataView.getBigUint64(8, true);        // trend_value
        const lastUpdate = dataView.getBigInt64(16, true);            // last_update

        const sbtcPriceInCents = Number(sbtcTrendValue);
        const sbtcPriceInDollars = sbtcPriceInCents / 100;

        return {
        success: true,
        data: {
            sbtc_target_price: sbtcPriceInDollars,
            sbtc_scaled_cents: sbtcPriceInCents,
            last_update: Number(lastUpdate),
            data_source: "Custom sBTC Oracle (Devnet)",
            program_id: ORACLE_CONFIG.PROGRAM_ID
        }
        };
    } catch (err) {
        console.error("Failed to load SBTC oracle:", err);
        return this.getFallbackSBTCPrice(err.message);
    }
    }

    getFallbackSBTCPrice(error) {
    const fallbackPrice = 40000;
    return {
        success: true,
        error,
        data: {
        sbtc_target_price: fallbackPrice,
        sbtc_scaled_cents: fallbackPrice * 100,
        timestamp: Date.now(),
        data_source: "Fallback SBTC Oracle"
        }
    };
    }

    /**
     * Get current Bitcoin price from Pyth Network with proper parsing
     */
    async getCurrentBitcoinPrice() {
    try {
        const res = await fetch(
        `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ORACLE_CONFIG.PYTH_PRICE_FEED_ID}`
        );
        const json = await res.json();
        // console.log("Hermes JSON:", json);

        // Validate response structure
        if (!json.parsed || !Array.isArray(json.parsed) || json.parsed.length === 0) {
        throw new Error("Invalid Hermes response: missing parsed price data");
        }

        // Extract Pyth price info
        const priceInfo = json.parsed[0]?.price;
        if (!priceInfo) {
        throw new Error("Hermes response did not include price info");
        }

        // Convert price using exponent
        const price = Number(priceInfo.price) * Math.pow(10, priceInfo.expo);
        // console.log("BTC price: ", price);

        return {
        success: true,
        data: {
            btc_price: price,
            confidence: Number(priceInfo.conf),
            exponent: priceInfo.expo,
            timestamp: priceInfo.publish_time,
            data_source: "Pyth Hermes REST API",
            feed_id: ORACLE_CONFIG.PYTH_PRICE_FEED
        }
        };
    } catch (err) {
        console.error("Hermes price fetch failed:", err);
        // console.log("Switching to fallback BTC price...");
        return this.getFallbackBtcPrice(err.message);
    }
    }

    /**
     * Get comprehensive price data including both SBTC and BTC prices
     */
    async getPriceData() {
        try {
            const [sbtcResult, btcResult] = await Promise.all([
                this.getCurrentSBTCPrice(),
                this.getCurrentBitcoinPrice()
            ]);

            return {
                success: sbtcResult.success && btcResult.success,
                data: {
                    sbtc: sbtcResult.data,
                    btc: btcResult.data,
                    timestamp: Date.now()
                },
                errors: {
                    sbtc: sbtcResult.error || null,
                    btc: btcResult.error || null
                }
            };
        } catch (error) {
            console.error('Error fetching price data:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Validate SBTC price against Bitcoin price
     */
    validatePrice(sbtcPrice, btcPrice) {
        if (!sbtcPrice || !btcPrice) {
            return { valid: false, reason: 'Missing price data' };
        }

        // Check if SBTC price is within 10x of BTC price
        const ratio = sbtcPrice / btcPrice;
        if (ratio > 10 || ratio < 0.1) {
            return { 
                valid: false, 
                reason: `SBTC price (${sbtcPrice}) is outside reasonable range compared to BTC price (${btcPrice})` 
            };
        }

        return { valid: true, ratio: ratio };
    }

    /**
     * Format price for display with commas
     */
    formatPrice(price, decimals = 2) {
        if (typeof price !== 'number' || isNaN(price)) {
            return '0.00';
        }
        
        // Format with commas for thousands separators
        const formatted = price.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        
        return formatted;
    }

    /**
     * Get network status
     */
    async getNetworkStatus() {
        try {
            const version = await this.makeRpcCall('getVersion');
            const slot = await this.makeRpcCall('getSlot');
            
            return {
                connected: true,
                version: version,
                currentSlot: slot,
                rpcUrl: this.rpcUrl
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                rpcUrl: this.rpcUrl
            };
        }
    }
}

const oracle = new StableBitcoinOracle();
window.oracle = oracle;
window.StableBitcoinOracle = StableBitcoinOracle;
