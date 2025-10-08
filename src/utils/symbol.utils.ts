export function convertFundingSymbol(symbol: 'USD' | 'USDT'): string {
  if (symbol === 'USDT') return 'fUST';
  return `f${symbol}`;
}
