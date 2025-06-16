const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tikdown",
  version: "1.0.2",
  author: "Shaon Ahmed",
  countDown: 0,
  role: 0,
  description: {
    en: "Download TikTok video or photo posts",
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
  const messageText = msg.link_preview_options?.url || msg.text || "";

  if (
    !messageText.startsWith("https://vt.tiktok.com") &&
    !messageText.startsWith("https://www.tiktok.com/") &&
    !messageText.startsWith("https://vm.tiktok.com")
  ) return;

  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  const loadingMsg = await bot.sendMessage(chatId, "⏳ Processing TikTok link...", {
    reply_to_message_id: messageId,
  });
  const loadingMsgId = loadingMsg.message_id;

  try {
    const { data } = await axios.post(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(messageText)}`
    );
    const result = data?.data;

    if (!result) {
      await bot.deleteMessage(chatId, loadingMsgId);
      return bot.sendMessage(chatId, "❌ Could not fetch data from TikTok.");
    }

    const authorName = result.author || "Unknown";
    const title = result.title || "No Title";

    // যদি ভিডিও থাকে এবং url আছে, ভিডিও পাঠাও
    if (result.play && result.play.length > 0) {
      const videoUrl = result.play;

      // ভিডিও ডাউনলোড করে temp ফাইলে রাখার জন্য (optional)
      const videoPath = path.join(__dirname, "caches", `tikvideo_${Date.now()}.mp4`);
      const videoResp = await axios.get(videoUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(videoPath);

      videoResp.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const caption = 
`👤 Author: SHAON AHMED
📝 Title: ${title}
🎥 Type: Video`;

      await bot.sendVideo(chatId, videoPath, {
        caption,
        reply_to_message_id: messageId,
      });

      fs.unlinkSync(videoPath);
      await bot.deleteMessage(chatId, loadingMsgId);
      return;
    }

    // অন্যথায় যদি images থাকে তাহলে ছবি পাঠাও
    if (result.images && Array.isArray(result.images) && result.images.length > 0) {
      const images = result.images;
      const total_photos = images.length;

      const captionText = 
`👤 Author: SHAON AHMED
📝 Title: ${title}
🖼️ Total Photos: ${total_photos}`;

      const CHUNK_SIZE = 10;
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
      }

      await bot.deleteMessage(chatId, loadingMsgId);
      return;
    }

    await bot.deleteMessage(chatId, loadingMsgId);
    await bot.sendMessage(chatId, "❌ No video or photos found in this TikTok post.");
  } catch (err) {
    await bot.deleteMessage(chatId, loadingMsgId);
    console.error("Error:", err);
    await bot.sendMessage(chatId, `❎ Error: ${err.message}`);
  }
};
