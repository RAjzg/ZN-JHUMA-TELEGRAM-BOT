const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tikdown",
  version: "1.0.5",
  author: "Shaon Ahmed",
  role: 0,
  description: {
    en: "Download TikTok video or photo posts from noobs-api-sable",
  },
  category: "𝗠𝗘𝗗𝗜𝗔",
  commandCategory: "𝗠𝗘𝗗𝗜𝗔",
  guide: {
    en: "[TikTok post link]",
  },
};

module.exports.run = async ({ event, bot, msg }) => {
  this.onChat({ event, bot, msg });
};

module.exports.onChat = async ({ event, bot, msg }) => {
  const messageText = msg.link_preview_options?.url  msg.text  "";

  if (
    !messageText.startsWith("https://vt.tiktok.com") &&
    !messageText.startsWith("https://www.tiktok.com/") &&
    !messageText.startsWith("https://vm.tiktok.com")
  )
    return;

  const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const Shaon = apis.data.allapi

  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  const loadingMsg = await bot.sendMessage(chatId, "⏳ Processing TikTok link...", {
    reply_to_message_id: messageId,
  });
  const loadingMsgId = loadingMsg.message_id;

  try {
    const { data } = await axios.get(
      ${Shaon}/tikdown?url=${encodeURIComponent(messageText)}
    );

    if (!data) {
      await bot.deleteMessage(chatId, loadingMsgId);
      return bot.sendMessage(chatId, "❌ Could not fetch data from TikTok.");
    }

    const authorName = data.author || "Unknown";
    const title = data.title || "No Title";

    if (data.video) {
      const videoUrl = data.video;
      const videoPath = path.join(__dirname, "caches", tikvideo_${Date.now()}.mp4);

      const videoResp = await axios.get(videoUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(videoPath);
      videoResp.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const caption = 👤 Author: ${authorName}\n📝 Title: ${title}\n🎥 Type: Video;

      await bot.sendVideo(chatId, videoPath, {
        caption,
        reply_to_message_id: messageId,
      });

      fs.unlinkSync(videoPath);
      await bot.deleteMessage(chatId, loadingMsgId);
      return;
    }

    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const images = data.images;
      const total_photos = data.total_photos || images.length;

      const captionText = 👤 Author: ${authorName}\n📝 Title: ${title}\n🖼️ Total Photos: ${total_photos};

      const CHUNK_SIZE = 10;
      const delay = ms => new Promise(res => setTimeout(res, ms));

      for (let i = 0; i < images.length; i += CHUNK_SIZE) {
        const batch = images.slice(i, i + CHUNK_SIZE);
        const mediaGroup = batch.map((url, index) => ({
          type: "photo",
          media: url,
          caption: i === 0 && index === 0 ? captionText : undefined,
          parse_mode: "HTML",
        }));

        await bot.sendMediaGroup(chatId, mediaGroup, {
          reply_to_message_id: messageId,
        });

        await delay(5000); // ৫ সেকেন্ড delay প্রতি ব্যাচের পরে
      }

      await bot.deleteMessage(chatId, loadingMsgId);
      return;
    }

    await bot.deleteMessage(chatId, loadingMsgId);
    await bot.sendMessage(chatId, "❌ No video or photos found in this TikTok post.");
  } catch (err) {
    await bot.deleteMessage(chatId, loadingMsgId);
    console.error("❎ TikTok Downloader Error:", err);
    await bot.sendMessage(chatId, ❎ Error: ${err.message});
  }
};
