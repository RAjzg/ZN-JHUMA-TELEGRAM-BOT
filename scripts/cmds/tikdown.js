const axios = require("axios");

module.exports.config = {
  name: "tikdown",
  version: "1.0",
  author: "SHAON AHMED",
  description: "Download TikTok video or photos using noobs-api",
  role: 0,
  category: "MEDIA",
};

module.exports.run = async ({ event, bot, msg }) => {
  try {
    const messageText = msg.text.trim();

    // URL চেক (TikTok URL হতে হবে)
    if (
      !messageText.startsWith("https://vt.tiktok.com") &&
      !messageText.startsWith("https://www.tiktok.com/") &&
      !messageText.startsWith("https://vm.tiktok.com")
    ) {
      return await bot.sendMessage(event.chat.id, "❌ TikTok URL পাঠান।");
    }

    // API কল
    const { data } = await axios.get(`https://noobs-api-sable.vercel.app/tikdown?url=${encodeURIComponent(messageText)}`);

    if (data.error) return await bot.sendMessage(event.chat.id, `❌ Error: ${data.error}`);

    const author = data.author || "SHAON AHMED";
    const title = data.title || "No title";

    if (data.video) {
      await bot.sendMessage(event.chat.id, `🎬 Title: ${title}\n👤 Author: ${author}`);
      await bot.sendVideo(event.chat.id, data.video, { caption: `🎬 ${title}\n👤 ${author}` });
    } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      await bot.sendMessage(event.chat.id, `🖼️ Title: ${title}\n👤 Author: ${author}\n📸 Total Photos: ${data.total_photos || data.images.length}`);

      for (let imgUrl of data.images) {
        await bot.sendPhoto(event.chat.id, imgUrl);
      }
    } else {
      await bot.sendMessage(event.chat.id, "❌ ভিডিও বা ছবি পাওয়া যায়নি। সঠিক TikTok URL দিন।");
    }
  } catch (err) {
    await bot.sendMessage(event.chat.id, `❌ Error: ${err.message || err}`);
  }
};
