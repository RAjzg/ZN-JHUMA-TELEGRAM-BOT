const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "xvideo",
    aliases: ["randomxvideos"],
    description: "Download and send random video from XVideos API",
    usage: "/xvideo [page]",
    cooldown: 5,
    author: "Raj + Modified by ChatGPT",
    role: 1, // Bot admins only
  },

  onStart: async function ({ message, event, args }) {
    try {
      const userId = event.from?.id;
      const page = args[0] || 3000;

      const response = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/xvideos?page=${page}`);
      const data = response.data?.result;

      if (!Array.isArray(data) || data.length === 0) {
        return message.reply("❌ কোনো ভিডিও পাওয়া যায়নি।");
      }

      // 🎯 Random ভিডিও পছন্দ করা
      const randomIndex = Math.floor(Math.random() * data.length);
      const video = data[randomIndex];
      const videoUrl = video.videoUrl;
      const title = video.title || "XVideo";
      const filePath = path.join(__dirname, "caches", `xvideo_${Date.now()}.mp4`);

      // ভিডিও ডাউনলোড শুরু
      const videoStream = (await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      })).data;

      const writer = fs.createWriteStream(filePath);
      videoStream.pipe(writer);

      writer.on("finish", async () => {
        await message.stream({
          url: fs.createReadStream(filePath),
          caption: `🔞 *${title}*\n\n📥 Downloaded from XVideos API`,
        });

        // 10 সেকেন্ড পর ফাইল মুছে ফেলো
        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 10000);
      });

      writer.on("error", (err) => {
        console.error("❌ ভিডিও সেভ করতে ব্যর্থ:", err);
        return message.reply("❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।");
      });

    } catch (err) {
      console.error("❌ API error:", err.message);
      return message.reply("❌ API থেকে ভিডিও আনতে সমস্যা হয়েছে।");
    }
  }
};
