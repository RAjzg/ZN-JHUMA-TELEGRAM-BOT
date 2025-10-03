const axios = require("axios");
const fs = require("fs");
const path = require("path");

let searchResults = {};

module.exports = {
  config: {
    name: "tik",
    version: "2.0.6",
    role: 0,
    credits: "Shaon Ahmed + ChatGPT",
    description: "Search TikTok and download video reliably (same response as /tiktok)",
    cooldown: 5,
  },

  onStart: async function ({ message, args, event }) {
    const body = event.text?.trim();
    const userId = event.from?.id;

    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // 🔁 Reply with number
    if (/^\d+$/.test(body) && searchResults[userId]) {
      const index = parseInt(body) - 1;
      const video = searchResults[userId][index];

      if (!video) return message.reply("❌ ভুল নাম্বার দিয়েছেন।");

      const videoUrl = video.play;
      if (!videoUrl) return message.reply("❌ ভিডিও URL পাওয়া যায়নি।");

      const filePath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);

      try {
        const videoResp = await axios.get(videoUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        fs.writeFileSync(filePath, Buffer.from(videoResp.data));

        const caption =
          `🎵 𝗧𝗶𝗸𝗧𝗼𝗸 ভিডিও\n` +
          `👤 Author: ${video.author?.nickname || "N/A"}\n` +
          `🔗 User: @${video.author?.unique_id || "N/A"}\n` +
          `🎬 Title: ${video.title || "No Title"}`;

        await message.stream({
          url: fs.createReadStream(filePath),
          caption: caption,
        });

        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 15000);
      } catch (e) {
        console.error("🎥 ডাউনলোড সমস্যা:", e.message);
        return message.reply("❌ ভিডিও আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
      }
      return;
    }

    // 🔍 Search handling
    const query = args.join(" ");
    if (!query) return message.reply("❌ লিখুন: /tik <search>");

    try {
      const apis = await axios.get(
        "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
      );
      const api = apis.data.alldl;

      const res = await axios.get(`${api}/tiktok/search?keywords=${encodeURIComponent(query)}`);
      const videos = res.data?.data?.videos;

      if (!Array.isArray(videos) || videos.length === 0) {
        return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
      }

      // ✅ Keep only necessary info
      searchResults[userId] = videos.slice(0, 10).map(v => ({
        play: v.play,
        title: v.title,
        author: v.author,
      }));

      const list = searchResults[userId]
        .map((v, i) => `${i + 1}. ${v.title?.slice(0, 80) || "No Title"}`)
        .join("\n\n");

      return message.reply(
        `🔍 "${query}" এর জন্য ভিডিও:\n\n${list}\n\n➡️ রিপ্লাই দিয়ে নাম্বার দিন যেকোনো ভিডিও আনতে।`
      );
    } catch (e) {
      console.error("❌ সার্চ API সমস্যা:", e.message);
      return message.reply("❌ TikTok সার্ভার থেকে ডেটা আনতে সমস্যা হয়েছে।");
    }
  },
};
