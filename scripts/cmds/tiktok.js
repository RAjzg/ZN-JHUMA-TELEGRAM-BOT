const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    version: "1.1",
    author: "ArYAN (Telegram Bot by Shaon)",
    role: 0,
    cooldown: 5,
    aliases: ["tik"],
    shortDescription: "Search and download TikTok video",
    category: "video",
    guide: {
      en: "/tiktok <search>"
    }
  },

  onStart: async function ({ message, args }) {
    const query = args.join(" ");
    if (!query) {
      return message.reply("❌ Usage:\n/tiktok <search text>");
    }

    await message.react("⏳");

    try {
      const res = await axios.get(`https://noobs-api-sable.vercel.app/tiktok/search?keywords=${encodeURIComponent(query)}`);
      const videos = res.data?.data?.videos;

      if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return message.reply("❌ No TikTok videos found for your query.");
      }

      const video = videos[0];
      const videoUrl = video.play;
      if (!videoUrl) {
        return message.reply("❌ No playable video URL found.");
      }

      const msgText = `🎵 *TIKTOK SEARCH* 🎵

👤 *Author:* ${video.author.nickname}
🔗 *Username:* @${video.author.unique_id}`;

      const filePath = path.join(__dirname, "cache", `tt_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(filePath);

      const videoStream = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
      videoStream.data.pipe(writer);

      writer.on("finish", async () => {
        await message.stream(
          fs.createReadStream(filePath),
          "video.mp4",
          msgText
        );
        fs.unlinkSync(filePath);
        await message.react("✅");
      });

      writer.on("error", () => {
        message.reply("❌ Failed to download the video.");
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Error fetching video data.");
    }
  }
};
