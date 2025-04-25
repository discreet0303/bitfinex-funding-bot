# Bitfinex Funding Bot

A Node.js application that interacts with the Bitfinex API to monitor funding rates and wallet balances. Built with TypeScript and Docker support.

## Features

- 📊 Monitor Bitfinex funding rates (fUSD, fUSDT)
- 💰 Check wallet balances across different account types (exchange, margin, funding)
- 🤖 Discord integration for automated notifications
- 🔄 Automated updates every 5 minutes
- 🐳 Docker support for easy deployment
- 📈 Real-time data from Bitfinex API

## Prerequisites

- Node.js 22 or higher
- npm (comes with Node.js)
- Docker (optional, for containerized deployment)
- Bitfinex API credentials
- Discord webhook URL (for notifications)

## Installation

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bitfinex-funding-bot.git
cd bitfinex-funding-bot
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
DISCORD_WEBHOOK_URL=your_discord_webhook_url
BITFINEX_API_KEY=your_bitfinex_api_key
BITFINEX_API_SECRET=your_bitfinex_api_secret
```

4. Build the TypeScript code:

```bash
npm run build
```

5. Start the application:

```bash
npm start
```

### Docker Setup

1. Build the Docker image:

```bash
docker build -t bitfinex-funding-bot .
```

2. Run the container:

```bash
docker run --env-file .env bitfinex-funding-bot
```

For production deployment with automatic restart:

```bash
docker run -d --env-file .env --restart unless-stopped bitfinex-funding-bot
```

## Configuration

### Environment Variables

- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL for notifications
- `BITFINEX_API_KEY`: Your Bitfinex API key
- `BITFINEX_API_SECRET`: Your Bitfinex API secret

### API Permissions

When creating your Bitfinex API key, ensure it has the following permissions:

- Read permission for wallet balances
- Read permission for funding data

## Features in Detail

### Funding Rate Monitoring

The bot monitors funding rates for:

- fUSD (USD funding)
- fUSDT (USDT funding)

Example response:

```typescript
{
  symbol: "fUSD",
  dailyRate: "0.000123",
  yearlyRate: "4.49%"
}
```

### Wallet Balance Checking

Retrieves balances across different wallet types:

- Exchange wallet
- Margin wallet
- Funding wallet

Example response:

```typescript
{
  walletType: "exchange",
  currency: "BTC",
  balance: 0.5,
  unsettledInterest: 0,
  availableBalance: 0.5
}
```

## Project Structure

```
bitfinex-funding-bot/
├── src/
│   ├── apis/
│   │   ├── bitfinex.api.ts
│   │   └── discord.api.ts
│   └── lib/
│       └── axios.lib.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── index.d.ts
```

## Scripts

- `npm run build`: Compile TypeScript code
- `npm start`: Start the application
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Error Handling

The application includes robust error handling for:

- API connection issues
- Authentication failures
- Rate limiting
- Network errors

All errors are logged and, where appropriate, notifications are sent via Discord.

## Security Considerations

1. Never commit your `.env` file
2. Use environment variables for sensitive data
3. Keep API keys secure and use minimum required permissions
4. Regularly rotate API keys
5. Monitor application logs for suspicious activity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Bitfinex for providing the API
- Node.js community for excellent tools and libraries
- Discord for webhook integration capabilities
