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
    // ইউজার মেসেজ থেকে টেক্সট নাও
    const messageText = (msg.text || "").trim();

    // TikTok URL না দিলে রিকোয়েস্ট বাতিল করো
    if (
      !messageText.startsWith("https://vt.tiktok.com") &&
      !messageText.startsWith("https://www.tiktok.com/") &&
      !messageText.startsWith("https://vm.tiktok.com")
    ) {
      return await bot.sendMessage(event.chat.id, "❌ TikTok URL পাঠান।");
    }

    // API থেকে ডাটা নিয়ে আসো
    const response = await axios.get(
      `https://noobs-api-sable.vercel.app/tikdown?url=${encodeURIComponent(messageText)}`
    );

    const data = response.data;

    if (data.error) {
      return await bot.sendMessage(event.chat.id, `❌ Error: ${data.error}`);
    }

    // author, title, total_photos
    const author = data.author || "SHAON AHMED";
    const title = data.title || "No Title";

    // ভিডিও আছে কি চেক করো
    if (data.video) {
      await bot.sendMessage(
        event.chat.id,
        `🎬 Title: ${title}\n👤 Author: ${author}`
      );
      await bot.sendVideo(event.chat.id, data.video, {
        caption: `🎬 ${title}\n👤 ${author}`,
      });
    }
    // না হলে ছবি থাকলে ছবি পাঠাও
    else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      await bot.sendMessage(
        event.chat.id,
        `🖼️ Title: ${title}\n👤 Author: ${author}\n📸 Total Photos: ${data.total_photos || data.images.length}`
      );

      for (const imgUrl of data.images) {
        await bot.sendPhoto(event.chat.id, imgUrl);
      }
    } else {
      // কিছু পাওয়া যায়নি
      await bot.sendMessage(
        event.chat.id,
        "❌ ভিডিও বা ছবি পাওয়া যায়নি। সঠিক TikTok URL দিন।"
      );
    }
  } catch (error) {
    await bot.sendMessage(event.chat.id, `❌ Error: ${error.message || error}`);
  }
};
