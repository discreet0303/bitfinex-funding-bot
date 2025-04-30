import cron from 'node-cron';
import dotenv from 'dotenv';
import { DiscordService } from './apis/discord.api';
import { BitfinexService } from './apis/bitfinex.api';

dotenv.config();

async function main() {
  const walletBalances = await BitfinexService.getWalletBalances();

  const title = 'Bitfinex Wallet Balances';
  const content = walletBalances
    .map(item => {
      return `- ${item.walletType}: ${item.currency} ${item.availableBalance}`;
    })
    .join('\n');

  await DiscordService.sendMessage(title, content);
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
