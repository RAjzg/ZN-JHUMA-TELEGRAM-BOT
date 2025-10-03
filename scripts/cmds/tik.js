const axios = require("axios");
const fs = require("fs");
const path = require("path");

let searchResults = {}; // ইউজার অনুযায়ী সার্চ ফলাফল রাখার জন্য

module.exports = {
  config: {
    name: "tik",
    version: "3.0.0",
    role: 0,
    credits: "Shaon Ahmed + ChatGPT",
    description: "Search TikTok, show list & download video by reply",
    cooldown: 5,
  },

  onStart: async function ({ message, args, event }) {
    const body = event.text?.trim();
    const userId = event.from?.id;

    // ✅ ensure caches folder
    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // 🔁 ইউজার reply দিলে video পাঠানো
    if (/^\d+$/.test(body) && searchResults[userId]) {
      const index = parseInt(body) - 1;
      const video = searchResults[userId][index];

      if (!video) return message.reply("❌ ভুল নাম্বার দিয়েছেন।");
      if (!video.play) return message.reply("❌ ভিডিও URL পাওয়া যায়নি।");

      const filePath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);

      try {
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
          url: video.play,
          method: "GET",
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const caption =
          `🎵 TikTok ভিডিও\n` +
          `👤 Author: ${video.author?.unique_id || "Unknown"}\n` +
          `🎬 Title: ${video.title?.slice(0, 100) || "No Title"}`;

        await message.stream({
          url: fs.createReadStream(filePath),
          caption: caption,
        });

        // 15 সেকেন্ড পরে ফাইল auto delete
        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 15000);
      } catch (e) {
        console.error("🎥 ডাউনলোড সমস্যা:", e.message);
        return message.reply("❌ ভিডিও আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
      }
      return;
    }

    // 🔍 সার্চ করা
    const query = args.join(" ");
    if (!query) return message.reply("❌ লিখুন: /tik <search>");

    try {
      const apis = await axios.get(
        "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
      );
      const api = apis.data.alldl;

      const res = await axios.get(
        `${api}/tiktok/search?keywords=${encodeURIComponent(query)}`
      );
      const videos = res.data?.data?.videos;

      if (!Array.isArray(videos) || videos.length === 0) {
        return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
      }

      // ✅ শুধু play URL + title + author রাখা
      searchResults[userId] = videos.slice(0, 10).map((v) => ({
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
