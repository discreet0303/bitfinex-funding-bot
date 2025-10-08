import { BigNumber } from 'bignumber.js';
import { BitfinexPrivateApi, BitfinexPublicApi } from '../lib/axios.lib';
import { convertFundingSymbol } from '../utils/symbol.utils';

/**
 * @description
 * Get funding rates for fUSD and fUSDT
 * Only lists lending prices, no borrowing prices
 * @param symbol - USD or USDT
 * @returns
 * - dailyRate: Rate level
 * - yearlyRate: Yearly rate
 * - period: Period level
 * - count: Number of orders at that price level
 * - amount: Total amount available at that price level (if AMOUNT > 0 then ask else bid)
 */
async function getFundingBooks(symbol: 'USD' | 'USDT', options?: { len: number }) {
  const { len = 25 } = options || {};

  const formattedSymbol = convertFundingSymbol(symbol);

  try {
    const res = await BitfinexPublicApi.get(`/book/${formattedSymbol}/P0`, {
      params: { len },
    });

    const metadata: {
      dailyRate: number;
      yearlyRate: number;
      period: number;
      count: number;
      amount: number;
    }[] = res.data
      .filter((item: [number, number, number, number]) => item[3] < 0)
      .map((item: [number, number, number, number]) => ({
        dailyRate: item[0] * 100,
        yearlyRate: new BigNumber(item[0]).multipliedBy(365 * 100).toNumber(),
        period: item[1],
        count: item[2],
        amount: item[3],
      }));

    return metadata;
  } catch (error) {
    console.error('Error fetching funding books:', error);
    throw new Error('Failed to fetch funding books');
  }
}

/**
 * @description Get user's wallet balances
 * @returns Array of wallet balances with currency, balance, and available amount
 */
async function getWalletBalances() {
  try {
    const res = await BitfinexPrivateApi.post('/auth/r/wallets', {});

    const metadata: {
      walletType: 'exchange' | 'margin' | 'funding';
      currency: string;
      balance: number;
      unsettledInterest: number;
      availableBalance: number;
    }[] = res.data.map((wallet: [string, string, number, number, number]) => ({
      walletType: wallet[0], // e.g. 'exchange', 'margin', 'funding'
      currency: wallet[1], // e.g. 'BTC', 'USD', etc.
      balance: wallet[2], // total balance
      unsettledInterest: wallet[3],
      availableBalance: wallet[4],
    }));

    return metadata;
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    throw new Error('Failed to fetch wallet balances');
  }
}

async function postFundingOffer(symbol: 'USDT', amount: number, rate: number, period: number) {
  if (amount < 150) {
    console.warn('The amount is less than 150, skipping funding offer.');
    return;
  }

  try {
    const formattedSymbol = convertFundingSymbol(symbol);
    const formattedRate = new BigNumber(rate).div(100).toString();

    const body = {
      type: 'LIMIT',
      symbol: formattedSymbol,
      amount: String(amount), // 出借金額
      rate: formattedRate, // 日利率
      period: period, // 天數
    };

    const res = await BitfinexPrivateApi.post('/auth/w/funding/offer/submit', body);

    const orderStatus = res.data[6];
    const orderRes = res.data[4];

    if (orderStatus === 'SUCCESS') {
      return {
        symbol: formattedSymbol,
        amount,
        rate: new BigNumber(rate).multipliedBy(365 * 100).toString(),
        period,
        status: orderStatus,
      };
    } else {
      console.error('Funding offer failed:', res.data);
      throw new Error(`Funding offer failed with status: ${orderRes}`);
    }
  } catch (error: any) {
    console.error('下單失敗:', error.response?.data || error.message);
  }
}

// MARK: Export

export const BitfinexService = {
  getFundingBooks,
  getWalletBalances,
  postFundingOffer,
};
