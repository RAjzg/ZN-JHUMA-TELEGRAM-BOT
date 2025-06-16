const axios = require("axios");

module.exports.config = {
  name: "tikpic",
  version: "1.0.1",
  author: "Shaon Ahmed",
  countDown: 0,
  role: 0,
  description: {
    en: "Download TikTok photo posts (not videos)",
  },
  category: "𝗣𝗛𝗢𝗧𝗢",
  commandCategory: "𝗠𝗘𝗗𝗜𝗔",
  guide: {
    en: "[TikTok photo post link]",
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

  const loading = await bot.sendMessage(chatId, "📸 Fetching TikTok photos...", {
    reply_to_message_id: messageId,
  });
  const loadingMsgId = loading.message_id;

  try {
    const { data } = await axios.post(`https://www.tikwm.com/api/?url=${encodeURIComponent(messageText)}`);
    const result = data?.data;

    if (!result.images || !Array.isArray(result.images) || result.images.length === 0) {
      await bot.deleteMessage(chatId, loadingMsgId);
      return bot.sendMessage(chatId, "❌ No photo found in this post.");
    }

    const images = result.images;
    const title = result.title || "No Title";
    const total_photos = images.length;

    const CHUNK_SIZE = 10;
    for (let i = 0; i < images.length; i += CHUNK_SIZE) {
      const batch = images.slice(i, i + CHUNK_SIZE);
      const mediaGroup = batch.map((url, index) => ({
        type: "photo",
        media: url,
        caption:
          i === 0 && index === 0
            ? `👤 Author: SHAON AHMED\n📝 Title: ${title}\n🖼️ Total Photos: ${total_photos}`
            : undefined,
        parse_mode: "HTML",
      }));

      await bot.sendMediaGroup(chatId, mediaGroup, {
        reply_to_message_id: messageId,
      });
    }

    await bot.deleteMessage(chatId, loadingMsgId);
  } catch (err) {
    await bot.deleteMessage(chatId, loadingMsgId);
    console.error("❌ Error:", err);
    bot.sendMessage(chatId, `❎ Error: ${err.message}`);
  }
};
