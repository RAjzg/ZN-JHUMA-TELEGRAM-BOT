const axios = require("axios");

module.exports = {
  config: {
    name: "album",
    version: "2.6.0",
    role: 0,
    author: "Shaon Ahmed",
    description: "Reply add via Imgur/Catbox and inline browser",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ api, event, args, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // ✅ Handle: /album add <category>
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();
      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        event?.reply_to_message?.photo?.slice(-1)[0];

      if (!file || !file.file_id) {
        return api.sendMessage(chatId, "❗ ভিডিও বা ছবিতে রিপ্লাই দিয়ে `/album add <category>` দিন।");
      }

      try {
        const fileLink = await api.getFileLink(file.file_id);
        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const imgur = apis.data.allapi;
        const base = apis.data.api;

        let finalUrl;
        const isVideo = !!event?.reply_to_message?.video;
        const duration = event?.reply_to_message?.video?.duration || 0;

        if (isVideo && duration > 60) {
          // Catbox use for >1 min videos
          const catboxUpload = await axios.get(`${imgur}/catbox?url=${encodeURIComponent(fileLink)}`);
          finalUrl = catboxUpload.data.url || catboxUpload.data.link;
        } else {
          // Imgur use for images or <=1 min video
          const imgurRes = await axios.get(`${imgur}/imgur?url=${encodeURIComponent(fileLink)}`);
          finalUrl = imgurRes.data.link || imgurRes.data.uploaded?.image;
        }

        if (!finalUrl) throw new Error("❌ Upload failed");

        await axios.get(`${base}/video/${category}?add=${category}&url=${encodeURIComponent(finalUrl)}`);
        return api.sendMessage(chatId, `✅ Added to '${category.toUpperCase()}'\n🔗 ${finalUrl}`);
      } catch (e) {
        console.error("Add failed:", e.message);
        return api.sendMessage(chatId, "❌ Upload বা add করতে ব্যর্থ হয়েছে।");
      }
    }

    // 🎬 Show inline buttons
    const videoSelectionMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Love', callback_data: '/video/love' }, { text: 'CPL', callback_data: '/video/cpl' }],
          [{ text: 'Short', callback_data: '/video/short' }, { text: 'Sad', callback_data: '/video/sad' }],
          [{ text: 'Status', callback_data: '/video/status' }, { text: 'Status2', callback_data: '/video/status2' }],
          [{ text: 'Status3', callback_data: '/video/status3' }, { text: 'Shairi', callback_data: '/video/shairi' }],
          [{ text: 'Baby', callback_data: '/video/baby' }, { text: 'Anime', callback_data: '/video/anime' }],
          [{ text: 'FF', callback_data: '/video/ff' }, { text: 'Lofi', callback_data: '/video/lofi' }],
          [{ text: 'Happy', callback_data: '/video/happy' }, { text: 'Football', callback_data: '/video/football' }],
          [{ text: 'Islam', callback_data: '/video/islam' }, { text: 'Humaiyun', callback_data: '/video/humaiyun' }],
          [{ text: 'Capcut', callback_data: '/video/capcut' }, { text: 'Sex', callback_data: '/video/sex' }],
          [{ text: 'Sex2', callback_data: '/video/sex2' }, { text: 'Sex3', callback_data: '/video/sex3' }],
          [{ text: 'Horny', callback_data: '/video/horny' }, { text: 'Hot', callback_data: '/video/hot' }],
          [{ text: 'Item', callback_data: '/video/item' }, { text: 'Random', callback_data: '/video/random' }]
        ]
      }
    };

    const categoryMessage = await api.sendMessage(chatId, "🎬 Select a video category:", videoSelectionMarkup);

    // ⏳ Handle callback when a category is selected
    bot.once("callback_query", async (callbackQuery) => {
      const categoryEndpoint = callbackQuery.data;
      await api.answerCallbackQuery(callbackQuery.id);

      const loading = await api.sendMessage(chatId, "⏳ Fetching video...");

      // ✅ Delete old buttons & loading message
      try {
        await api.deleteMessage(chatId, categoryMessage.message_id);
      } catch (e) {}

      try {
        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const base = apis.data.api;

        const res = await axios.get(`${base}${categoryEndpoint}`);
        const caption = res.data.shaon || res.data.cp || "🎬 Here's your video:";

        let videoUrl;

        if (typeof res.data.data === "string") {
          videoUrl = res.data.data;
        } else if (Array.isArray(res.data.data)) {
          const random = res.data.data[Math.floor(Math.random() * res.data.data.length)];
          videoUrl = random?.url;
        } else if (typeof res.data.data === "object" && res.data.data.url) {
          videoUrl = res.data.data.url;
        } else if (res.data.url) {
          videoUrl = res.data.url;
        } else {
          throw new Error("❌ Invalid response format");
        }

        if (!videoUrl || typeof videoUrl !== "string") throw new Error("❌ Invalid video URL");

        const isDrive = videoUrl.includes("drive.google.com");
        const isImage = videoUrl.match(/\.(jpg|jpeg|png|gif)(\?.*)?$/i);
        const isVideo = videoUrl.match(/\.(mp4|mov|m4v|webm)(\?.*)?$/i);

        if (isVideo || isDrive) {
          await api.sendVideo(chatId, videoUrl, {
            caption,
            reply_to_message_id: loading.message_id,
            reply_markup: {
              inline_keyboard: [[{ text: "🧑‍💻 Owner", url: "https://t.me/shaonproject" }]],
            },
          });
        } else if (isImage) {
          await api.sendPhoto(chatId, videoUrl, {
            caption,
            reply_to_message_id: loading.message_id,
            reply_markup: {
              inline_keyboard: [[{ text: "🧑‍💻 Owner", url: "https://t.me/shaonproject" }]],
            },
          });
        } else {
          await api.sendDocument(chatId, videoUrl, {
            caption,
            reply_to_message_id: loading.message_id,
            reply_markup: {
              inline_keyboard: [[{ text: "🧑‍💻 Owner", url: "https://t.me/shaonproject" }]],
            },
          });
        }

        await api.deleteMessage(chatId, loading.message_id);
      } catch (err) {
        console.error(err.message);
        await api.editMessageText(chatId, loading.message_id, `❌ Error: ${err.message}`);
      }
    });
  }
};
