const fs = require("fs");
const path = require("path");
const axios = require("axios");

let currentIndex = 0; // ভিডিও কোন index থেকে শুরু হবে

// 🎬 এখানে তোমার Imgur ভিডিও links list
const VIDEO_LIST = [
  "https://i.imgur.com/SxQcmb3.mp4",
  "https://i.imgur.com/HP1702t.mp4",
];

module.exports = {
  config: {
    name: "Zuma",
    version: "1.0.0",
    role: 0,
    credits: "Shaon Ahmed",
    description: "Imgur video rotate by /Zuma command",
    category: "media",
    usages: "/Zuma",
    cooldowns: 5,
  },

  run: async function({ bot, msg }) {
    const chatId = msg.chat.id;

    try {
      const timestamp = Date.now();
      const videoUrl = VIDEO_LIST[currentIndex];
      const videoPath = path.join(__dirname, `zuma_${timestamp}.mp4`);

      // next video index
      currentIndex++;
      if(currentIndex >= VIDEO_LIST.length) currentIndex = 0;

      // ⬇️ Download video
      const res = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
        timeout: 60000
      });

      const writer = fs.createWriteStream(videoPath);
      res.data.pipe(writer);

      writer.on("finish", async () => {
        // Send video
        await bot.sendVideo(chatId, videoPath, {
          caption: `🎬 Zuma Video #${currentIndex}`,
          reply_to_message_id: msg.message_id
        });

        fs.unlinkSync(videoPath); // clean up
      });

      writer.on("error", (err) => {
        console.error("Download Error:", err);
        bot.sendMessage(chatId, "❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।");
      });

    } catch (err) {
      console.error("General Error:", err);
      bot.sendMessage(chatId, "❌ কিছু সমস্যা হয়েছে।");
    }
  }
};
