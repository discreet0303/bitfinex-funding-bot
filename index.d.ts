declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_WEBHOOK_URL: string;
    BITFINEX_API_KEY: string;
    BITFINEX_API_SECRET: string;
    CRON_SCHEDULE?: string;
  }
}
