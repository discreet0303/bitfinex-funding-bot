import axios from 'axios';

export const BitfinexPublicApi = axios.create({
  baseURL: 'https://api-pub.bitfinex.com/v2',
  headers: {
    Accept: 'application/json',
  },
});
