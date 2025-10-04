// Simple Oracle connection test
import oracle from './oracle.js';

async function testOracle() {
    try {
        console.log('🔌 Testing Oracle connection...');
        await oracle.initialize();
        console.log('✅ Oracle connected successfully!');
        
        console.log('📊 Fetching price data...');
        const priceData = await oracle.getPriceData();
        
        if (priceData.success) {
            console.log('✅ Price data retrieved:');
            console.log('   SBTC Price:', priceData.data.sbtc?.sbtc_target_price || 'N/A');
            console.log('   BTC Price:', priceData.data.btc?.btc_price || 'N/A');
        } else {
            console.log('❌ Failed to get price data:', priceData.errors);
        }
        
    } catch (error) {
        console.error('❌ Oracle test failed:', error.message);
    }
}

testOracle();
