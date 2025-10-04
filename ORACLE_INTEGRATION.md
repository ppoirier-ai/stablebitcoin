# StableBitcoin Oracle Integration

This document explains how the StableBitcoin frontend integrates with the Pyth Network price Oracle on Solana DevNet.

## Overview

The frontend now queries real SBTC price data directly from the Solana DevNet Oracle instead of using simulated data. This provides accurate, real-time pricing information for the StableBitcoin protocol.

## Architecture

### Oracle Module (`oracle.js`)
- **Connection**: Connects to Solana DevNet RPC endpoint
- **Program ID**: `FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa`
- **Pyth Price Feed**: `8SXvChNYFh3qEi4J6tK1wQREu5x6YdE3C6HmZzThoG6E` (BTC/USD)
- **Data Sources**: 
  - SBTC target price from Oracle program
  - Bitcoin price from Pyth Network

### Frontend Integration
- **Real-time Updates**: Prices update every 30 seconds
- **Status Indicator**: Shows Oracle connection status
- **Error Handling**: Graceful fallback to simulated data
- **Price Validation**: Ensures SBTC price is within reasonable bounds

## Features

### 1. Real-time Price Display
- SBTC price updates automatically from Oracle
- Visual status indicator shows connection state
- Fallback to simulated data if Oracle unavailable

### 2. Swap Integration
- Exchange rates calculated using real Oracle prices
- Price impact calculated based on trade size vs Oracle price
- Validation ensures prices are within reasonable ranges

### 3. Error Handling
- Connection status monitoring
- Graceful degradation when Oracle unavailable
- User notifications for connection issues

## Usage

### Starting the Application
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Testing Oracle Integration
Open `test-oracle.html` in your browser to test individual Oracle functions:
- Connection test
- SBTC price fetching
- Bitcoin price fetching
- Full price data retrieval
- Network status check

### Oracle Configuration
The Oracle configuration is in `oracle.js`:

```javascript
const ORACLE_CONFIG = {
    RPC_URL: 'https://api.devnet.solana.com',
    PROGRAM_ID: 'FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa',
    PYTH_PRICE_FEED: '8SXvChNYFh3qEi4J6tK1wQREu5x6YdE3C6HmZzThoG6E',
    ORACLE_STATE_ACCOUNT: 'FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa'
};
```

## API Reference

### Oracle Class Methods

#### `initialize()`
Initializes connection to Solana DevNet.

#### `getCurrentSBTCPrice()`
Returns current SBTC target price from Oracle.

**Response:**
```javascript
{
    success: true,
    data: {
        sbtc_target_price: 46257.62,
        sbtc_scaled_cents: 4625762,
        timestamp: 1759553965,
        data_source: 'Solana DevNet Oracle',
        program_id: 'FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa'
    }
}
```

#### `getCurrentBitcoinPrice()`
Returns current Bitcoin price from Pyth Network.

**Response:**
```javascript
{
    success: true,
    data: {
        btc_price: 46257.62,
        timestamp: 1759553965,
        data_source: 'Pyth Network',
        price_feed_id: '8SXvChNYFh3qEi4J6tK1wQREu5x6YdE3C6HmZzThoG6E'
    }
}
```

#### `getPriceData()`
Returns comprehensive price data including both SBTC and BTC prices.

#### `validatePrice(sbtcPrice, btcPrice)`
Validates that SBTC price is within reasonable bounds compared to BTC price.

## Error Handling

The integration includes comprehensive error handling:

1. **Connection Errors**: Falls back to simulated data
2. **Price Validation**: Warns if prices are outside reasonable ranges
3. **Network Issues**: Shows status indicators and user notifications
4. **Data Parsing**: Handles malformed Oracle responses

## Security Considerations

- **Price Validation**: SBTC price must be within 10x of BTC price
- **Data Source Verification**: Only accepts data from verified Oracle program
- **Error Boundaries**: Prevents Oracle errors from breaking the UI
- **Fallback Mechanisms**: Ensures app remains functional even if Oracle fails

## Development

### Adding New Oracle Features
1. Extend the `StableBitcoinOracle` class in `oracle.js`
2. Add corresponding UI updates in `script.js`
3. Update error handling and validation
4. Test with `test-oracle.html`

### Debugging
- Check browser console for Oracle connection logs
- Use `test-oracle.html` to test individual functions
- Monitor network status in the UI status indicator

## Dependencies

- `@solana/web3.js`: Solana blockchain interaction
- `@coral-xyz/anchor`: Anchor framework for Solana programs
- `buffer`: Buffer polyfill for browser compatibility

## Network Information

- **RPC Endpoint**: `https://api.devnet.solana.com`
- **Network**: Solana DevNet
- **Oracle Program**: `FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa`
- **Pyth Price Feed**: `8SXvChNYFh3qEi4J6tK1wQREu5x6YdE3C6HmZzThoG6E`

## Troubleshooting

### Common Issues

1. **Oracle Connection Failed**
   - Check internet connection
   - Verify Solana DevNet is accessible
   - Check browser console for detailed errors

2. **Price Data Not Updating**
   - Verify Oracle program is deployed and active
   - Check if price feed account exists
   - Monitor network status indicator

3. **Module Import Errors**
   - Ensure all dependencies are installed (`npm install`)
   - Check that files are served over HTTP/HTTPS (not file://)
   - Verify module syntax is correct

### Support

For issues related to:
- **Oracle Program**: Check the [StableBitcoin-PriceOracle repository](https://github.com/ppoirier-ai/StableBitcoin-PriceOracle)
- **Pyth Network**: Visit [Pyth Network documentation](https://docs.pyth.network/)
- **Solana DevNet**: Check [Solana documentation](https://docs.solana.com/)
