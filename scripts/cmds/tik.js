const axios = require("axios");
const fs = require("fs");
const path = require("path");

let searchResults = {};

module.exports = {
  config: {
    name: "tik",
    version: "2.0.3",
    role: 0,
    credits: "Shaon Ahmed + ChatGPT",
    description: "Search TikTok and download video (Telegram)",
    cooldown: 5,
  },

  onStart: async function ({ message, args, event }) {
    const body = event.text?.trim();
    const userId = event.from?.id;

    // ✅ ensure caches dir
    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // 🔁 যদি ইউজার রিপ্লাই করে নাম্বার
    if (/^\d+$/.test(body) && searchResults[userId]) {
      const index = parseInt(body) - 1;
      const video = searchResults[userId][index];

      if (!video) {
        return message.reply("❌ ভুল নাম্বার দিয়েছেন।");
      }

      const tiktokUrl =
        video.share_url ||
        `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;
      const apiUrl = `https://noobs-api-sable.vercel.app/tikdown?url=${encodeURIComponent(
        tiktokUrl
      )}`;

      try {
        const res = await axios.get(apiUrl);
        if (!res.data?.video) return message.reply("❌ ভিডিও লিংক পাওয়া যায়নি।");

        const videoUrl = res.data.video;
        const filePath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);

        // ⬇️ download to file
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const caption =
          `🎵 TikTok ভিডিও\n` +
          `👤 Author: ${res.data.author || "Unknown"}\n` +
          `🎬 Title: ${res.data.title?.slice(0, 100) || "No Title"}`;

        await message.stream({
          url: fs.createReadStream(filePath),
          caption: caption
        });

        // cleanup after 15s
        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 15000);
      } catch (e) {
        console.error("🎥 ডাউনলোড সমস্যা:", e.message);
        return message.reply("❌ ভিডিও আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
      }

      return;
    }

    // 🔍 সার্চ হ্যান্ডলিং
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
      const videos = res.data?.data?.videos.play;

      if (!Array.isArray(videos) || videos.length === 0) {
        return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
      }

      searchResults[userId] = videos.slice(0, 10);

      const list = videos
        .slice(0, 10)
        .map((v, i) => `${i + 1}. ${v.title?.slice(0, 80) || "No Title"}`)
        .join("\n\n");

      return message.reply(
        `🔍 "${query}" এর জন্য ভিডিও:\n\n${list}\n\n➡️ রিপ্লাই দিয়ে নাম্বার দিন যেকোনো ভিডিও আনতে।`
      );
    } catch (e) {
      console.error("❌ সার্চ API সমস্যা:", e.message);
      return message.reply("❌ TikTok সার্ভার থেকে ডেটা আনতে সমস্যা হয়েছে।");
    }
  }
};
