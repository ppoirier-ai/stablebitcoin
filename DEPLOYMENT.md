# StableBitcoin Deployment Guide

## Render.com Deployment

### Prerequisites
- GitHub repository with your code
- Render.com account
- All dependencies committed to repository

### Deployment Steps

#### 1. **No Code Changes Required**
Your current setup is already optimized for Render.com deployment. The new Oracle and wallet integrations are browser-compatible and don't require server-side changes.

#### 2. **Deploy to Render.com**
1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:
   - **Name**: `stablebitcoin`
   - **Environment**: `Static Site`
   - **Build Command**: `npm install`
   - **Publish Directory**: `.` (root directory)
   - **Start Command**: `./start.sh`

#### 3. **Environment Variables (Optional)**
The following environment variables are pre-configured in `render.yaml`:
- `NODE_ENV=production`
- `ORACLE_RPC_URL=https://api.devnet.solana.com`
- `ORACLE_PROGRAM_ID=FtDpp1TsamUskkz2AS7NTuRGqyB3j4dpP7mj9ATHbDoa`
- `PYTH_PRICE_FEED=8SXvChNYFh3qEi4J6tK1wQREu5x6YdE3C6HmZzThoG6E`

#### 4. **Deployment Features**
- ✅ **Oracle Integration**: Works with Solana DevNet
- ✅ **Phantom Wallet**: Browser-based wallet connection
- ✅ **CORS Headers**: Configured for cross-origin requests
- ✅ **Security Headers**: XSS protection, content type validation
- ✅ **Static File Serving**: Optimized for static assets
- ✅ **Environment Configuration**: Production-ready settings

### What's New Since Last Deployment

#### **Oracle Integration**
- Real-time SBTC price fetching from Solana DevNet
- Fallback pricing when Oracle unavailable
- Price validation and error handling
- Comma-formatted price displays

#### **Phantom Wallet Integration**
- Connect/disconnect functionality
- Account change detection
- Transaction signing capabilities
- Wallet state management

#### **UI Improvements**
- Price formatting with commas (e.g., `$46,257.62`)
- Wallet connection status indicators
- Enhanced error handling and notifications
- Responsive design improvements

### Testing After Deployment

#### **1. Basic Functionality**
- Visit your deployed URL
- Check that the page loads correctly
- Verify SBTC price displays with commas

#### **2. Oracle Integration**
- Open browser console
- Check for Oracle connection logs
- Verify price updates every 30 seconds

#### **3. Wallet Integration**
- Test "Connect Wallet" button
- Verify Phantom wallet detection
- Test connect/disconnect functionality

#### **4. Test Pages**
- Visit `/test-simple.html` for Oracle tests
- Visit `/test-wallet.html` for wallet tests
- Verify all test functions work

### Troubleshooting

#### **Common Issues**

1. **Oracle Connection Fails**
   - Check browser console for CORS errors
   - Verify Solana DevNet is accessible
   - Fallback pricing should still work

2. **Wallet Not Detected**
   - Ensure Phantom wallet is installed
   - Check browser console for errors
   - Test with different browsers

3. **Price Display Issues**
   - Check for JavaScript errors in console
   - Verify comma formatting is working
   - Test with different price ranges

#### **Debug Mode**
Add `?debug=true` to your URL to enable additional logging:
```
https://your-app.onrender.com?debug=true
```

### Performance Optimizations

#### **Already Implemented**
- ✅ Static file serving with proper headers
- ✅ CORS configuration for Oracle API calls
- ✅ Browser-compatible modules (no bundling required)
- ✅ Optimized asset loading
- ✅ Security headers for production

#### **Future Optimizations**
- Consider CDN for static assets
- Implement service worker for offline functionality
- Add compression for better performance

### Monitoring

#### **Render.com Dashboard**
- Monitor deployment status
- Check build logs for errors
- View performance metrics

#### **Browser Console**
- Monitor Oracle connection status
- Check wallet integration logs
- Verify error handling

### Rollback Plan

If issues occur after deployment:
1. Go to Render.com dashboard
2. Navigate to your service
3. Go to "Deploys" tab
4. Click "Rollback" on previous working deployment

### Support

For deployment issues:
- Check Render.com documentation
- Review browser console for errors
- Test locally with `npm run dev`
- Verify all files are committed to repository

## Environment Configuration

### Development
```bash
npm run dev
# Uses localhost:3000
# Oracle: Solana DevNet
# Wallet: Phantom (if installed)
```

### Production (Render.com)
```bash
./start.sh
# Uses Render.com assigned port
# Oracle: Solana DevNet (configurable)
# Wallet: Phantom (browser-based)
```

## File Structure
```
stablebitcoin/
├── index.html              # Main application
├── script.js               # Main JavaScript
├── oracle-browser.js       # Oracle integration
├── wallet.js               # Phantom wallet integration
├── styles.css              # Styling
├── render.yaml             # Render.com configuration
├── start.sh                # Production start script
├── test-simple.html        # Oracle test page
├── test-wallet.html        # Wallet test page
└── package.json            # Dependencies
```

## Dependencies
- `http-server`: Static file serving
- `@solana/web3.js`: Solana blockchain interaction (browser-compatible)
- `@coral-xyz/anchor`: Anchor framework (browser-compatible)
- `buffer`: Buffer polyfill for browser

All dependencies are browser-compatible and don't require server-side processing.
