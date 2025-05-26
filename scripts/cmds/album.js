const axios = require("axios");

module.exports = {
  config: {
    name: "album",
    version: "1.0.0",
    role: 0,
    author: "Dipto", //Don't Change Author name.
    description: "Displays album options for selection.",
    category: "Media",
    countDown: 5,
    },
  
  onStart = async ({ event, bot, message, adminBatton}) => {
  const { message } = event;
    
  const chatId = message.chat.id;

  const videoSelectionMarkup = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Love', callback_data: '/video/love' },
          { text: 'CPL', callback_data: '/video/cpl' }
        ],
        [
          { text: 'Short Video', callback_data: '/video/shortvideo' },
          { text: 'Sad Video', callback_data: '/video/sadvideo' }
        ],
        [
          { text: 'Status', callback_data: '/video/status' },
          { text: 'Shairi', callback_data: '/video/shairi' }
        ],
        [
          { text: 'Baby', callback_data: '/video/baby' },
          { text: 'Anime', callback_data: '/video/anime' }
        ],
        [
          { text: 'Humaiyun', callback_data: '/video/humaiyun' },
          { text: 'Islam', callback_data: '/video/islam' }
        ],
        [
          { text: 'Horny', callback_data: '/video/horny' },
          { text: 'Hot', callback_data: '/video/hot' }
        ],
        [
          { text: 'Random', callback_data: '/video/random' }
        ]
      ]
    }
  };

  const waitMsg = await message.reply(chatId, "Select Video Type", videoSelectionMarkup);

  api.once('callback_query', async (callbackQuery) => {
    const name = callbackQuery.data;
    await message.reply(chatId, waitMsg.message_id);

    const waitVoiceMsg = await message.reply(chatId, "Please wait...", { reply_to_message_id: message.message_id });

    try {
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
      
  const Shaon = apis.data.api;

      const data = await axios.get(${Shaon}${name});
      console.log(data.data);
      const url = data.data || data.url;
      const caption = data.shaon || ${data.cp};

      

      await message.reply(chatId, url, { caption: caption, reply_to_message_id: message.message_id, ...adminBatton });
      await bot.deleteMessage(chatId, waitVoiceMsg.message_id);
    } catch (error) {
      await bot.deleteMessage(chatId, waitVoiceMsg.message_id);
      console.error('Error getting file info:', error);
      message.reply(chatId, "❌ Failed to fetch video. Try again later.", { reply_to_message_id: message.message_id });
    }
  });
};
