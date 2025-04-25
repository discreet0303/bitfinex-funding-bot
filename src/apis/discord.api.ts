import axios from 'axios';

/**
 * @description Send message to Discord webhook
 * @param title - Title of the message
 * @param content - Content of the message
 */
async function sendMessage(title: string, content: string): Promise<void> {
  const dcUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!dcUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set');
    return;
  }

  const mdContent = `
    **${title}**\n${content}
  `;

  await axios.post(dcUrl, { content: mdContent });
}

export const DiscordService = {
  sendMessage,
};
