// Simple test to verify Oracle integration works
import oracle from './oracle.js';

console.log('🧪 Testing Oracle integration...');

async function testOracle() {
    try {
        console.log('1. Initializing Oracle...');
        await oracle.initialize();
        console.log('✅ Oracle initialized successfully');

        console.log('2. Fetching SBTC price...');
        const sbtcResult = await oracle.getCurrentSBTCPrice();
        console.log('SBTC Result:', sbtcResult);

        console.log('3. Fetching BTC price...');
        const btcResult = await oracle.getCurrentBitcoinPrice();
        console.log('BTC Result:', btcResult);

        console.log('4. Fetching full price data...');
        const fullResult = await oracle.getPriceData();
        console.log('Full Result:', fullResult);

        if (fullResult.success && fullResult.data) {
            console.log('✅ Oracle integration working!');
            console.log('SBTC Price:', fullResult.data.sbtc?.sbtc_target_price || 'N/A');
            console.log('BTC Price:', fullResult.data.btc?.btc_price || 'N/A');
        } else {
            console.log('❌ Oracle integration failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testOracle();
