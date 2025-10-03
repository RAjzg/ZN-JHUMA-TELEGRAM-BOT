const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "album",
    version: "5.3.0",
    role: 0,
    author: "Shaon Ahmed + ChatGPT",
    description: "Album system with caches folder streaming",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ api, event, args, bot, message }) => {
    const chatId = event.chat?.id || event.threadID;
    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const baseApi = apis.data.api;
    const imgurApi = apis.data.allapi;

    async function downloadToFile(url, destPath) {
      const res = await axios.get(url, { responseType: "stream", headers: { "User-Agent": "Mozilla/5.0" } });
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(destPath);
        res.data.pipe(writer);
        res.data.on("error", (err) => { writer.close(); reject(err); });
        writer.on("error", (err) => { writer.close(); reject(err); });
        writer.on("finish", resolve);
      });
    }

    async function streamFileToChat(filePath, caption) {
      if (message && typeof message.stream === "function") {
        await message.stream({ url: fs.createReadStream(filePath), caption });
      } else {
        await api.sendVideo(chatId, fs.createReadStream(filePath), { caption });
      }
    }

    // ================= ADD =================
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();
      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        (event?.reply_to_message?.photo?.length > 0 && event.reply_to_message.photo.slice(-1)[0]);

      if (!file || !file.file_id) {
        return api.sendMessage(chatId, "📢 খবর আছে! ভিডিও বা ছবিতে reply করে `/album add <category>` দিন।");
      }

      try {
        const fileLink = await api.getFileLink(file.file_id);
        const isVideo = !!event?.reply_to_message?.video;
        const duration = event?.reply_to_message?.video?.duration || 0;
        const ext = file.file_name ? path.extname(file.file_name) : isVideo ? ".mp4" : ".jpg";
        const cachedName = `${file.file_unique_id}${ext}`;
        const cachedPath = path.join(cacheDir, cachedName);

        if (!fs.existsSync(cachedPath)) {
          if (isVideo && duration > 60) {
            // >1 min video → Catbox
            const catboxRes = await axios.get(`${imgurApi}/catbox?url=${encodeURIComponent(fileLink)}`);
            const url = catboxRes.data.url || catboxRes.data.link;
            await downloadToFile(url, cachedPath);
          } else {
            // ≤1 min video / image → download directly
            await downloadToFile(fileLink, cachedPath);
          }
        }

        await streamFileToChat(cachedPath, `✅ Added to '${category.toUpperCase()}'`);
        await axios.get(`${baseApi}/video/${category}?add=${category}&url=${encodeURIComponent(cachedPath)}`);
      } catch (err) {
        console.error("Add failed:", err);
        return api.sendMessage(chatId, "❌ মিডিয়া আপলোড বা সংরক্ষণ ব্যর্থ হয়েছে।");
      }
      return;
    }

    // ================= INLINE BUTTON =================
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

    bot.once("callback_query", async (callbackQuery) => {
      const categoryEndpoint = callbackQuery.data;
      await api.answerCallbackQuery(callbackQuery.id);

      const loading = await api.sendMessage(chatId, "⏳ Fetching video...");
      try { await api.deleteMessage(chatId, categoryMessage.message_id); } catch(e){}

      try {
        const res = await axios.get(`${baseApi}${categoryEndpoint}`);
        const caption = res.data.shaon || res.data.cp || "🎬 Here's your video:";
        let videoUrl = res.data.data?.url || res.data.data?.[0]?.url || res.data.url;

        if (!videoUrl) throw new Error("❌ Invalid video URL");

        const ext = path.extname(videoUrl) || ".mp4";
        const cachedFile = path.join(cacheDir, `video_${Date.now()}${ext}`);
        await downloadToFile(videoUrl, cachedFile);

        await streamFileToChat(cachedFile, caption);
        try { fs.unlinkSync(cachedFile); } catch(e) {}

        await api.deleteMessage(chatId, loading.message_id);
      } catch (err) {
        console.error(err);
        await api.editMessageText(chatId, loading.message_id, `❌ Error: ${err.message}`);
      }
    });
  }
};
