import axios from 'axios';
import crypto from 'crypto';

export const BitfinexPublicApi = axios.create({
  baseURL: 'https://api-pub.bitfinex.com/v2',
  headers: {
    Accept: 'application/json',
  },
});

export const BitfinexPrivateApi = axios.create({
  baseURL: 'https://api.bitfinex.com/v2',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

BitfinexPrivateApi.interceptors.request.use(config => {
  const apiPath = `v2${config.url}`;
  const body = JSON.stringify(config.data || {});

  const nonce = (Date.now() * 1000).toString();
  const signaturePayload = `/api/${apiPath}${nonce}${body}`;
  const signature = crypto
    .createHmac('sha384', process.env.BITFINEX_API_SECRET)
    .update(signaturePayload)
    .digest('hex');

  config.headers['bfx-nonce'] = nonce;
  config.headers['bfx-apikey'] = process.env.BITFINEX_API_KEY;
  config.headers['bfx-signature'] = signature;

  return config;
});
