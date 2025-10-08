import cron from 'node-cron';
import dotenv from 'dotenv';
import { DiscordService } from './apis/discord.api';
import { BitfinexService } from './apis/bitfinex.api';

dotenv.config();

async function checkWalletAvailableBalance() {
  let walletBalances = await BitfinexService.getWalletBalances();
  walletBalances = walletBalances.filter(item => item.balance > 150);

  if (walletBalances.length === 0) return [];
  return walletBalances;
}

async function pickFundingRate(symbol: 'USD' | 'USDT') {
  const fundingBooks = await BitfinexService.getFundingBooks(symbol);
  if (fundingBooks.length === 0) return null;

  const groupedByPeriod = fundingBooks.reduce(
    (acc, offer) => {
      if (!acc[offer.period]) {
        acc[offer.period] = offer;
      } else if (offer.yearlyRate > acc[offer.period].yearlyRate) {
        acc[offer.period] = offer;
      }
      return acc;
    },
    {} as { [key: number]: (typeof fundingBooks)[0] },
  );

  // First priority: 120 days with annual rate >= 10%
  const funding120 = groupedByPeriod[120];
  if (funding120 && funding120.yearlyRate >= 10) {
    return {
      rate: Number(funding120.dailyRate.toFixed(6)),
      period: 120,
      availableAmount: funding120.amount,
    };
  }

  // // Last priority: 2 days
  // const funding2 = groupedByPeriod[2];
  // if (funding2) {
  //   return { rate: funding2.dailyRate, period: 2, availableAmount: funding2.amount };
  // }

  return null;
}

async function main() {
  const walletBalances = await checkWalletAvailableBalance();

  if (walletBalances.length === 0) return;

  for (const wallet of walletBalances) {
    if (wallet.availableBalance <= 150) continue;

    const walletMsg: string = `- ${wallet.walletType}: ${wallet.currency} ${wallet.balance} (Available: ${wallet.availableBalance})`;

    await DiscordService.sendMessage('Wallet balance', walletMsg);

    if (wallet.currency === 'UST') {
      const fundingRate = await pickFundingRate('USDT');

      if (!fundingRate || wallet.availableBalance > Math.abs(fundingRate.availableAmount)) continue;

      const amountToOffer = wallet.availableBalance <= 300 ? wallet.availableBalance : 300;

      const fundingOffer = await BitfinexService.postFundingOffer(
        'USDT',
        amountToOffer,
        fundingRate.rate,
        fundingRate.period,
      );

      if (fundingOffer) {
        const title = 'Bitfinex Funding Offer';
        const contents = [
          `- Funding Offer Posted:`,
          `  - Symbol: USDT`,
          `  - Amount: ${amountToOffer}`,
          `  - Rate: ${fundingRate.rate}`,
          `  - Period: ${fundingOffer?.period}`,
        ];

        await DiscordService.sendMessage(title, contents.join('\n'));
      }
    }
  }
}

// Get cron schedule from environment variables, default to every 5 minutes
const cronSchedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

// Schedule the main function to run based on the cron schedule
cron.schedule(cronSchedule, () => {
  console.log('執行定時查詢：', new Date().toLocaleString());
  main().catch(error => {
    console.error('Error in scheduled task:', error);
  });
});
