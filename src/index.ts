import cron from 'node-cron';
import dotenv from 'dotenv';
import { DiscordService } from './apis/discord.api';
import { BitfinexService } from './apis/bitfinex.api';

dotenv.config();

const MIN_BALANCE = 150;
const MAX_OFFER_AMOUNT = Number(process.env.DEFAULT_OFFER_AMOUNT) || 300;

async function checkWalletAvailableBalance() {
  console.log('檢查錢包餘額...');
  let walletBalances = await BitfinexService.getWalletBalances();
  console.log(`取得 ${walletBalances.length} 個錢包`);
  
  walletBalances = walletBalances.filter(item => item.balance >= MIN_BALANCE);
  console.log(`過濾後有 ${walletBalances.length} 個錢包餘額 >= ${MIN_BALANCE}`);

  if (walletBalances.length === 0) return [];
  return walletBalances;
}

async function pickFundingRate(symbol: 'USD' | 'USDT', amount: number) {
  console.log(`[${symbol}] 挑選 funding rate，金額: ${amount}`);
  
  if (amount < MIN_BALANCE) {
    console.log(`[${symbol}] 金額小於 ${MIN_BALANCE}，跳過`);
    return [];
  }

  const fundingBooks = await BitfinexService.getFundingBooks(symbol);
  console.log(`[${symbol}] 取得 ${fundingBooks.length} 筆 funding book 資料`);
  
  if (fundingBooks.length === 0) return [];

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

  let fundingRate: {rate: number, period: number} | undefined = undefined;

  const funding2 = groupedByPeriod[2];
  const funding120 = groupedByPeriod[120];

  if (funding2 && funding2.yearlyRate >= 9) {
    // First priority: 2 days with annual rate >= 9%
    fundingRate = {
      rate: Number(funding2.dailyRate.toFixed(6)),
      period: 2,
    }
    console.log(`[${symbol}] 選擇 2 天期，年化率: ${funding2.yearlyRate.toFixed(2)}%, 日利率: ${fundingRate.rate}%`);
  }
  else if (funding120 && funding120.yearlyRate >= 10) {
    // Second priority: 120 days with annual rate >= 10%
    fundingRate = {
      rate: Number(funding120.dailyRate.toFixed(6)),
      period: 120,
    }
    console.log(`[${symbol}] 選擇 120 天期，年化率: ${funding120.yearlyRate.toFixed(2)}%, 日利率: ${fundingRate.rate}%`);
  }

  // If no suitable funding rate found, return empty array
  if (!fundingRate) {
    console.log(`[${symbol}] 未找到符合條件的 funding rate`);
    return [];
  }

  // Split amount into chunks of MAX_OFFER_AMOUNT and create offer objects
  const offers: Array<{amount: number, rate: number, period: number}> = [];
  let remainingAmount = amount;

  while (remainingAmount >= MIN_BALANCE) {
    const offerAmount = Math.min(remainingAmount, MAX_OFFER_AMOUNT);
    offers.push({
      amount: offerAmount,
      rate: fundingRate.rate,
      period: fundingRate.period,
    });
    remainingAmount -= offerAmount;
  }

  console.log(`[${symbol}] 產生 ${offers.length} 筆 offer，總金額: ${amount}`);
  return offers;
}

async function main() {
  console.log('=== 開始執行 funding bot ===');
  const walletBalances = await checkWalletAvailableBalance();

  if (walletBalances.length === 0) {
    console.log('沒有符合條件的錢包，結束執行');
    return;
  }

  for (const wallet of walletBalances) {
    console.log(`\n處理錢包: ${wallet.walletType} ${wallet.currency}`);
    
    if (wallet.availableBalance < MIN_BALANCE) {
      console.log(`可用餘額 ${wallet.availableBalance} < ${MIN_BALANCE}，跳過`);
      continue;
    }

    const walletMsg: string = `- ${wallet.walletType}: ${wallet.currency} ${wallet.balance} (Available: ${wallet.availableBalance})`;

    await DiscordService.sendMessage('Wallet balance', walletMsg);

    let symbol: 'USD' | 'USDT' | undefined = undefined;

    if (wallet.currency === 'UST') {
      symbol = 'USDT';
    } else if (wallet.currency === 'USD') {
      symbol = 'USD';
    }

    if (symbol === undefined) {
      console.log(`不支援的貨幣: ${wallet.currency}`);
      continue;
    }

    const fundingOffers = await pickFundingRate(symbol, wallet.availableBalance);

    if (fundingOffers.length === 0) {
      console.log(`[${symbol}] 沒有可用的 funding offer`);
      continue;
    }

    console.log(`[${symbol}] 開始提交 ${fundingOffers.length} 筆 funding offer`);
    
    for (const offer of fundingOffers) {
      console.log(`提交 offer: ${offer.amount} @ ${offer.rate}% / ${offer.period} 天`);
      
      const fundingOffer = await BitfinexService.postFundingOffer(
        symbol,
        offer.amount,
        offer.rate,
        offer.period,
      );

      if (fundingOffer) {
        console.log(`✓ Offer 提交成功: ${offer.amount} @ ${offer.rate}% / ${fundingOffer.period} 天`);
        
        const title = 'Bitfinex Funding Offer';
        const contents = [
          `[${symbol}] $${offer.amount} - ${offer.rate} / ${fundingOffer?.period} days`,
        ];

        await DiscordService.sendMessage(title, contents.join('\n'));
      } else {
        console.log(`✗ Offer 提交失敗`);
      }
    }
  }
  
  console.log('\n=== Funding bot 執行完成 ===');
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
