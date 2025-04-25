import { BitfinexPrivateApi, BitfinexPublicApi } from '../lib/axios.lib';

/**
 * @description Get funding rates for fUSD and fUSDT
 * @param symbol - fUSD or fUSDT
 * @returns
 * - dailyRate: Rate level
 * - yearlyRate: Yearly rate
 * - period: Period level
 * - count: Number of orders at that price level
 * - amount: Total amount available at that price level (if AMOUNT > 0 then ask else bid)
 */
async function getFundingBooks(symbol: 'fUSD' | 'fUSDT', options?: { len: number }) {
  const { len = 25 } = options || {};

  try {
    const res = await BitfinexPublicApi.get(`/book/${symbol}/P0`, { params: { len } });

    const metadata: {
      dailyRate: number;
      yearlyRate: number;
      period: number;
      count: number;
      amount: number;
    }[] = res.data.map((item: [number, number, number, number]) => ({
      dailyRate: item[0] * 100,
      yearlyRate: item[0] * 365 * 100,
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

// MARK: Export

export const BitfinexService = {
  getFundingBooks,
  getWalletBalances,
};
