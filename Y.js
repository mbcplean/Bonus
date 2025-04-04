const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');

// Replace with your actual bot token from BotFather
const token = '7280298230:AAEIe_fnf2UMGj75kFwDLfNUUGdFMxfVbnE';
const bot = new TelegramBot(token, { polling: true });

// Helper mapping for quality selection (this is a basic approach)
const qualityMap = {
  '1080p': 'highest',
  '720p': 'highest',  // Adjust as needed based on available formats
  '480p': 'lowest'
};

// Listen for incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text.trim();

  // Validate the YouTube URL
  if (!ytdl.validateURL(url)) {
    bot.sendMessage(chatId, '🚫 Please send a valid YouTube link! 🚫');
    return;
  }

  // Prepare an inline keyboard with quality options
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '1080p 📺', callback_data: JSON.stringify({ url, resolution: '1080p' }) },
          { text: '720p 📺', callback_data: JSON.stringify({ url, resolution: '720p' }) }
        ],
        [
          { text: '480p 📺', callback_data: JSON.stringify({ url, resolution: '480p' }) }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, 'Please choose the video quality:', options);
});

// Handle inline keyboard callbacks
bot.on('callback_query', async (callbackQuery) => {
  try {
    const data = JSON.parse(callbackQuery.data);
    const chatId = callbackQuery.message.chat.id;
    const url = data.url;
    const resolution = data.resolution;

    // Inform the user that the download is starting
    await bot.sendMessage(chatId, `Downloading video in ${resolution}... ⏬🔽`);

    // Select the quality option based on the chosen resolution
    const selectedQuality = qualityMap[resolution];

    // Stream the video directly using ytdl-core
    const stream = ytdl(url, { quality: selectedQuality });

    // Send the video stream to the user without saving it permanently
    bot.sendVideo(chatId, stream, {}, { filename: 'video.mp4' })
      .then(() => {
        bot.sendMessage(chatId, 'Video sent! ✅ The temporary data has been cleared. 🗑️');
      })
      .catch((error) => {
        console.error(error);
        bot.sendMessage(chatId, 'An error occurred while processing your request. ❌');
      });

    // Acknowledge the callback query
    bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error(err);
    bot.sendMessage(callbackQuery.message.chat.id, 'An unexpected error occurred. ❌');
  }
});
