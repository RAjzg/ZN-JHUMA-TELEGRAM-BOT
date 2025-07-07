const axios = require("axios");

module.exports = { config: { name: "album", version: "1.1.0", role: 0, author: "Shaon Ahmed", description: "Displays album options for selection and allows video add via Imgur", category: "Media", countDown: 5, },

onStart: async ({ event, bot, api, args }) => { const chatId = event.chat.id;

// Check if the user wants to add a video to a specific category
if (args[0] === "add" && args[1]) {
  const category = args[1].toLowerCase();
  const waitMsg = await api.sendMessage(chatId, `📥 Now send a video to add to '${category.toUpperCase()}'`);

  bot.once("message", async (msg) => {
    if (!msg.video) {
      return api.sendMessage(chatId, "❗ Please send a valid video file.");
    }

    try {
      const fileLink = await api.getFileLink(msg.video.file_id);
      const imgurUpload = `https://web-api-delta.vercel.app/imgur?url=${encodeURIComponent(fileLink)}`;
      const imgurRes = await axios.get(imgurUpload);
      const imgurLink = imgurRes.data.link;
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const base = apis.data.api
  

      const addApi = `${base}/video/${category}?add=${category}&url=${encodeURIComponent(imgurLink)}`;
      await axios.get(addApi);

      return api.sendMessage(chatId, `✅ Video added successfully to ${category.toUpperCase()}\n🔗 ${imgurLink}`);
    } catch (err) {
      console.error("Add error:", err.message);
      return api.sendMessage(chatId, "❌ Failed to add video. Please try again.");
    }
  });

  return;
}

// Normal inline keyboard selection
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

    const res = await axios.get(`${Shaon}${name}`);
    const videoUrl = res.data.url || res.data.data;
    const caption = res.data.cp || res.data.shaon || "";

    if (!videoUrl) throw new Error("No video URL in response");

    await api.sendVideo(chatId, videoUrl, {
      caption,
      reply_to_message_id: waitMsg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "Bot Owner", url: 'https://t.me/shaonproject' }]]
      }
    });

    await api.deleteMessage(chatId, waitMsg.message_id);
    await api.deleteMessage(chatId, waitVoiceMsg.message_id);

  } catch (error) {
    console.error("❌ Error fetching video:", error.message);
    await api.deleteMessage(chatId, waitVoiceMsg.message_id);
    await api.sendMessage(chatId, `❌ Failed to fetch video.\n🔍 Debug: ${error.message}`, { reply_to_message_id: waitMsg.message_id });
  }
});

} };

