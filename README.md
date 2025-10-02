# StableBitcoin

A modern, responsive landing page for the StableBitcoin decentralized stability protocol, featuring an interactive swap interface for zBTC to SBTC conversions.

## Features

- **Modern Design**: Clean, professional UI with smooth animations and responsive design
- **Interactive Swap Interface**: Complete UI mockup for zBTC to SBTC token swapping
- **Mobile Responsive**: Optimized for all device sizes
- **Real-time Updates**: Simulated price ticker and balance updates
- **Smooth Animations**: CSS animations and transitions for enhanced UX
- **Notification System**: User feedback for actions and errors

## Project Structure

```
stablebitcoin/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
├── package.json        # Project dependencies and scripts
├── README.md           # Project documentation
└── StableBitcoin Litepaper.pdf  # Project whitepaper
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/stablebitcoin/stablebitcoin.git
cd stablebitcoin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Or use the simple HTTP server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Development

- `npm run dev` - Start live-reload development server
- `npm start` - Start simple HTTP server
- `npm run serve` - Start server on port 8080

### Production

Simply serve the static files using any web server. The application is built with vanilla HTML, CSS, and JavaScript with no build process required.

## Features Overview

### Landing Page Sections

1. **Hero Section**: Main value proposition with animated crypto icons
2. **About Section**: Key features and benefits of StableBitcoin
3. **Swap Interface**: Interactive zBTC to SBTC conversion tool
4. **Protocol Features**: Detailed explanation of stability mechanisms
5. **Call-to-Action**: User engagement and next steps

### Swap Interface

The swap interface includes:
- Token input fields with balance display
- Real-time exchange rate calculation
- Slippage and fee information
- Swap direction toggle
- Transaction simulation
- Error handling and notifications

### Responsive Design

- Mobile-first approach
- Breakpoints for tablet and desktop
- Touch-friendly interface elements
- Optimized typography and spacing

## Technology Stack

- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Interactive functionality
- **Font Awesome**: Icons and visual elements
- **Google Fonts**: Inter font family

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [stablebitcoin.org](https://stablebitcoin.org)
- Email: info@stablebitcoin.org
- Twitter: [@StableBitcoin](https://twitter.com/StableBitcoin)

## Acknowledgments

- Bitcoin community for inspiration
- DeFi protocols for design patterns
- Open source contributors

---

**Note**: This is a frontend mockup. Smart contracts and backend functionality will be implemented separately as mentioned in the requirements.
