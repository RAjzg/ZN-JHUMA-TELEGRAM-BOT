const axios = require("axios");

module.exports = {
  config: {
    name: "album",
    version: "2.3.0",
    role: 0,
    author: "Shaon Ahmed",
    description: "Reply add and inline video browser for album categories",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ api, event, args, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // ✅ যদি রিপ্লাই দিয়ে /album add <category> কমান্ড দেয়
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();

      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        event?.reply_to_message?.photo?.slice(-1)[0];

      if (!file) {
        return api.sendMessage(chatId, "❗ দয়া করে ভিডিও/ছবিতে রিপ্লাই দিয়ে `/album add <category>` কমান্ড দিন।");
      }

      try {
        const fileLink = await api.getFileLink(file.file_id);
        const isVideo = file.mime_type?.startsWith("video") || fileLink.endsWith(".mp4");

        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const base = apis.data.api;
        const imgur = apis.data.imgur;

        let finalUrl = fileLink;

        if (!isVideo) {
          const imgurRes = await axios.get(`${imgur}/imgur?url=${encodeURIComponent(fileLink)}`);
          finalUrl = imgurRes.data.link || imgurRes.data.uploaded?.image;
        }

        await axios.get(`${base}/video/${category}?add=${category}&url=${encodeURIComponent(finalUrl)}`);
        return api.sendMessage(chatId, `✅ Added to '${category.toUpperCase()}'\n🔗 ${finalUrl}`);
      } catch (e) {
        console.error("Add failed:", e.message);
        return api.sendMessage(chatId, "❌ Failed to upload or add.");
      }
    }

    // 🎬 ক্যাটাগরি বেছে নিয়ে ভিডিও দেখার UI
    const videoSelectionMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Love', callback_data: '/video/love' }, { text: 'CPL', callback_data: '/video/cpl' }],
          [{ text: 'Short', callback_data: '/video/shortvideo' }, { text: 'Sad', callback_data: '/video/sadvideo' }],
          [{ text: 'Status', callback_data: '/video/status' }, { text: 'Shairi', callback_data: '/video/shairi' }],
          [{ text: 'Baby', callback_data: '/video/baby' }, { text: 'Anime', callback_data: '/video/anime' }],
          [{ text: 'FF', callback_data: '/video/ff' }, { text: 'Lofi', callback_data: '/video/lofi' }],
          [{ text: 'Happy', callback_data: '/video/happy' }, { text: 'Football', callback_data: '/video/football' }],
          [{ text: 'Islam', callback_data: '/video/islam' }, { text: 'Humaiyun', callback_data: '/video/humaiyun' }],
          [{ text: 'Capcut', callback_data: '/video/capcut' }, { text: 'Sex', callback_data: '/video/sex' }],
          [{ text: 'Horny', callback_data: '/video/horny' }, { text: 'Hot', callback_data: '/video/hot' }],
          [{ text: 'Random', callback_data: '/video/random' }]
        ]
      }
    };

    const waitMsg = await api.sendMessage(chatId, "🎬 Select a video category:", videoSelectionMarkup);

    bot.once("callback_query", async (callbackQuery) => {
      const categoryEndpoint = callbackQuery.data;
      await api.answerCallbackQuery(callbackQuery.id);

      const loadingMsg = await api.sendMessage(chatId, "⏳ Fetching video...", { reply_to_message_id: waitMsg.message_id });

      try {
        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const base = apis.data.api;

        const res = await axios.get(`${base}${categoryEndpoint}`);
        const videoUrl = res.data.url || res.data.data;
        const caption = res.data.cp || res.data.shaon || "🎥 Here's your video:";

        if (!videoUrl) throw new Error("No video found");

        await api.sendVideo(chatId, videoUrl, {
          caption,
          reply_to_message_id: waitMsg.message_id,
          reply_markup: {
            inline_keyboard: [[{ text: "🧑‍💻 Owner", url: "https://t.me/shaonproject" }]]
          }
        });

        await api.deleteMessage(chatId, loadingMsg.message_id);
        await api.deleteMessage(chatId, waitMsg.message_id);

      } catch (err) {
        await api.deleteMessage(chatId, loadingMsg.message_id);
        await api.sendMessage(chatId, `❌ Error: ${err.message}`, { reply_to_message_id: waitMsg.message_id });
      }
    });
  }
};
