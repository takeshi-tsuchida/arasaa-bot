require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { handleMessage } = require('./handlers/message');
const { handlePostback } = require('./handlers/postback');
const { startCron } = require('./cron');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const app = express();

app.post(
  '/webhook',
  line.middleware(config),
  async (req, res) => {
    res.sendStatus(200);
    const events = req.body.events;
    for (const event of events) {
      try {
        if (event.type === 'message') {
          await handleMessage(client, event);
        } else if (event.type === 'postback') {
          await handlePostback(client, event);
        }
      } catch (err) {
        console.error('Event handling error:', err.message);
      }
    }
  }
);

app.get('/', (req, res) => res.send('アラサー会Bot is running 🍺'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCron(client);
});
