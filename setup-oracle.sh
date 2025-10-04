#!/bin/bash

# StableBitcoin Oracle Integration Setup Script
# This script installs dependencies and sets up the Oracle integration

echo "🚀 Setting up StableBitcoin Oracle Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create a simple test script
echo "🧪 Creating test script..."
cat > test-oracle-connection.js << 'EOF'
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
EOF

echo "✅ Test script created: test-oracle-connection.js"

# Create a simple start script
echo "🚀 Creating start script..."
cat > start-with-oracle.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting StableBitcoin with Oracle integration..."
echo "📱 Open your browser to: http://localhost:3000"
echo "🧪 Test Oracle integration at: http://localhost:3000/test-oracle.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev
EOF

chmod +x start-with-oracle.sh

echo "✅ Start script created: start-with-oracle.sh"

# Display next steps
echo ""
echo "🎉 Oracle integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Run the application:"
echo "   ./start-with-oracle.sh"
echo "   or"
echo "   npm run dev"
echo ""
echo "2. Test Oracle connection:"
echo "   Open http://localhost:3000/test-oracle.html in your browser"
echo ""
echo "3. View the main application:"
echo "   Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see ORACLE_INTEGRATION.md"
echo ""
echo "🔧 Oracle Configuration:"
echo "   - Network: Solana DevNet"
echo "   - Program ID: FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa"
echo "   - Pyth Price Feed: 8SXvChNYFh3qEi4J6tK1wQREu5x6YdE3C6HmZzThoG6E"
echo ""
