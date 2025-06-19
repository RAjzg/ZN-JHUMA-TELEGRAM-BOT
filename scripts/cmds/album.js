const axios = require("axios");

module.exports = {
  config: {
    name: "album",
    version: "1.0.1",
    role: 0,
    author: "Dipto",
    description: "Displays album options for selection.",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ event, bot, api }) => {
    const chatId = event.chat.id;
    const videoSelectionMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Love', callback_data: '/video/love' }, { text: 'CPL', callback_data: '/video/cpl' }],
          [{ text: 'Short Video', callback_data: '/video/shortvideo' }, { text: 'Sad Video', callback_data: '/video/sadvideo' }],
          [{ text: 'Status', callback_data: '/video/status' }, { text: 'Shairi', callback_data: '/video/shairi' }],
          [{ text: 'Baby', callback_data: '/video/baby' }, { text: 'Anime', callback_data: '/video/anime' }],
          [{ text: 'ff', callback_data: '/video/ff' }, { text: 'lofi', callback_data: '/video/lofi' }],
          [{ text: 'happy', callback_data: '/video/happy' }, { text: 'football', callback_data: '/video/football' }],
          [{ text: 'Islam', callback_data: '/video/islam' }, { text: 'Humaiyun', callback_data: '/video/humaiyun' }],
          [{ text: 'Capcut', callback_data: '/video/capcut' }, { text: 'Sex', callback_data: '/video/sex' }],
          [{ text: 'Horny', callback_data: '/video/horny' }, { text: 'Hot', callback_data: '/video/hot' }],
          [{ text: 'Random', callback_data: '/video/random' }]
        ]
      }
    };

    const waitMsg = await api.sendMessage(chatId, "🎬 Select Video Type", videoSelectionMarkup);

    bot.once('callback_query', async (callbackQuery) => {
      const name = callbackQuery.data;
      await api.answerCallbackQuery(callbackQuery.id);
      const waitVoiceMsg = await api.sendMessage(chatId, "⏳ Please wait...", { reply_to_message_id: waitMsg.message_id });

      try {
        const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
        const Shaon = apis.data.api;
        console.log("🔗 Base API URL:", Shaon, "Name:", name);

        const res = await axios.get(`${Shaon}${name}`);
        console.log("📦 Video fetch response:", res.data);

        const videoUrl = res.data.url || res.data.data;
        const caption = res.data.cp || res.data.shaon || "";
        if (!videoUrl) throw new Error("No video URL in response");

        await api.sendVideo(chatId, videoUrl, {
          caption,
          reply_to_message_id: waitMsg.message_id,
          reply_markup: { inline_keyboard: [[{ text: "Bot Owner", url: 'https://t.me/shaonproject' }]] }
        });

        await api.deleteMessage(chatId, waitMsg.message_id);
        await api.deleteMessage(chatId, waitVoiceMsg.message_id);

      } catch (error) {
        console.error("❌ Error fetching video:", error.message);
        await api.deleteMessage(chatId, waitVoiceMsg.message_id);
        await api.sendMessage(chatId, `❌ Failed to fetch video.\n🔍 Debug: ${error.message}`, { reply_to_message_id: waitMsg.message_id });
      }
    });
  }
};
