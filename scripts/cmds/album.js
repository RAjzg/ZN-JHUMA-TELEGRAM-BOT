const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "caches");

// Ensure cache folder exists
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

module.exports = {
  config: {
    name: "album",
    version: "2.6.3",
    role: 0,
    author: "Shaon Ahmed",
    description: "Reply add via Imgur/Catbox and cached local file",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ api, event, args, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // ✅ Handle: /album add <category>
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();

      // Determine the file type from reply
      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        event?.reply_to_message?.photo?.slice(-1)[0];

      if (!file || !file.file_id) {
        return api.sendMessage(chatId, "❗ ভিডিও বা ছবিতে রিপ্লাই দিয়ে `/album add <category>` দিন।");
      }

      try {
        // Get Telegram file link
        const fileLink = await api.getFileLink(file.file_id);

        // Generate cache file path
        const ext = file.file_name ? path.extname(file.file_name) : (file.mime_type?.split("/")[1] || "bin");
        const cachedFileName = `${file.file_unique_id}${ext}`;
        const cachedFilePath = path.join(CACHE_DIR, cachedFileName);

        // Download file only if not cached
        if (!fs.existsSync(cachedFilePath)) {
          const response = await axios.get(fileLink, { responseType: "stream" });
          const writer = fs.createWriteStream(cachedFilePath);
          response.data.pipe(writer);
          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });
        }

        // Send cached file
        const replyOptions = { caption: `✅ Added to '${category.toUpperCase()}'` };
        if (file.video) {
          await api.sendVideo(chatId, fs.createReadStream(cachedFilePath), replyOptions);
        } else if (file.photo) {
          await api.sendPhoto(chatId, fs.createReadStream(cachedFilePath), replyOptions);
        } else {
          await api.sendDocument(chatId, fs.createReadStream(cachedFilePath), replyOptions);
        }

        // Optionally, call your API to add
        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const base = apis.data.api;
        await axios.get(`${base}/video/${category}?add=${category}&url=${encodeURIComponent(cachedFilePath)}`);
      } catch (e) {
        console.error("Add failed:", e.message);
        return api.sendMessage(chatId, "❌ Upload বা add করতে ব্যর্থ হয়েছে।");
      }

      return;
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

    await api.sendMessage(chatId, "🎬 Select a video category:", videoSelectionMarkup);
  },
};
