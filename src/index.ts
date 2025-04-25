import cron from 'node-cron';
import dotenv from 'dotenv';
import { DiscordService } from './apis/discord.api';
import { BitfinexService } from './apis/bitfinex.api';

dotenv.config();

async function main() {
  const data = await BitfinexService.getWalletBalances();

  // Send available balance to Discord
  // type, currency, availableBalance
  const title = `Bitfinex Wallet Balances`;
  const content = data
    .map(item => {
      return `- ${item.walletType}: ${item.currency} ${item.availableBalance}`;
    })
    .join('\n');

  DiscordService.sendMessage(title, content);
}

// 每 5 分鐘執行
cron.schedule('*/1 * * * *', () => {
  console.log('執行定時查詢：', new Date().toLocaleString());
  main();
});
