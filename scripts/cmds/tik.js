const axios = require("axios");
const fs = require("fs");
const path = require("path");

let searchResults = {};

module.exports.config = {
  name: "tik",
  version: "2.0.1",
  role: 0,
  credits: "Shaon Ahmed + ChatGPT",
  description: "Search TikTok & download selected video via /tikdown",
  category: "media",
  usages: "/tik <search text> or reply with number",
  cooldowns: 5,
};

module.exports.run = async function ({ message, args, event }) {
  const body = event.body?.trim();

  // যদি ইউজার reply করে কোনো সংখ্যা (1-10)
  if (/^\d+$/.test(body) && searchResults[event.senderID]) {
    const index = parseInt(body) - 1;
    const video = searchResults[event.senderID][index];

    if (!video) {
      return message.reply("❌ ভুল নাম্বার দিয়েছেন।");
    }

    // TikTok ভিডিও URL বানানো হচ্ছে
    const tiktokUrl = video.share_url || `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;
    const apiUrl = `https://noobs-api-sable.vercel.app/tikdown?url=${encodeURIComponent(tiktokUrl)}`;

    try {
      const res = await axios.get(apiUrl);
      if (!res.data || !res.data.video) {
        return message.reply("❌ ভিডিও লিংক পাওয়া যায়নি।");
      }

      const videoUrl = res.data.video;
      const filePath = path.join(__dirname, "caches", `tiktok_${Date.now()}.mp4`);

      // ভিডিও ডাউনলোড
      const videoResp = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      fs.writeFileSync(filePath, Buffer.from(videoResp.data));

      const caption =
        `🎵 𝗧𝗶𝗸𝗧𝗼𝗸 ভিডিও 🎵\n` +
        `👤 Author: ${res.data.author || "Unknown"}\n` +
        `🎬 Title: ${res.data.title?.slice(0, 100) || "No Title"}`;

      // বট ভিডিও পাঠাচ্ছে
      await message.stream({
        url: fs.createReadStream(filePath),
        caption: caption,
      });

      // ১০ সেকেন্ড পরে ফাইল ডিলিট
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 10000);

    } catch (e) {
      console.error("[Tik Error]", e.message);
      return message.reply("❌ ভিডিও আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }

    return;
  }

  // যদি কেউ নতুন করে TikTok সার্চ করে
  const query = args.join(" ");
  if (!query) {
    return message.reply("❌ লিখুন: /tik <search text>");
  }

  try {
    // API লিস্ট ফেচ করে নিচ্ছি
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const api = apis.data.alldl;

    // TikTok সার্চ করা হচ্ছে
    const res = await axios.get(`${api}/tiktok/search?keywords=${encodeURIComponent(query)}`);
    const videos = res.data?.data?.videos;

    if (!Array.isArray(videos) || videos.length === 0) {
      return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
    }

    // সর্বোচ্চ 10টি ভিডিও মেমোরিতে রাখি
    searchResults[event.senderID] = videos.slice(0, 10);

    // ভিডিওর
