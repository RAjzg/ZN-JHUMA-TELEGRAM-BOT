const axios = require("axios");
const fs = require("fs");
const path = require("path");

let searchResults = {};

module.exports.config = {
  name: "tik",
  version: "1.2.0",
  role: 0,
  credits: "Shaon Ahmed",
  description: "Search and send TikTok video by number",
  category: "media",
  usages: "/tik <search> or reply with number",
  cooldowns: 5,
};

module.exports.run = async function ({ message, args, event }) {
  const body = event.body?.trim();

  // যদি ইউজার নাম্বার রিপ্লাই করে
  if (/^\d+$/.test(body) && searchResults[event.senderID]) {
    const index = parseInt(body) - 1;
    const video = searchResults[event.senderID][index];

    if (!video) {
      return message.reply("❌ ভুল নাম্বার দিয়েছেন। লিস্টে থাকা নাম্বার দিন।");
    }

    const videoUrl = video.play || video.wmplay;
    if (!videoUrl) return message.reply("❌ ভিডিও লিংক পাওয়া যায়নি।");

    console.log("📽️ ভিডিও লিংক:", videoUrl);

    const filePath = path.join(__dirname, "caches", `tiktok_${Date.now()}.mp4`);

    try {
      const videoResp = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      console.log("📥 ভিডিও সাইজ:", videoResp.data.length);

      fs.writeFileSync(filePath, Buffer.from(videoResp.data));

      const nickname = video.author?.nickname || "Unknown";
      const uid = video.author?.unique_id || "Unknown";

      const caption =
        `🎵 𝗧𝗶𝗸𝗧𝗼𝗸 𝗩𝗶𝗱𝗲𝗼 🎵\n` +
        `🎬 Title: ${video.title || "N/A"}\n` +
        `👤 Author: ${nickname}\n` +
        `🔗 User: @${uid}`;

      message.stream({
        url: fs.createReadStream(filePath),
        caption: caption,
      });

      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 10000);
    } catch (err) {
      console.error("❌ ভিডিও ডাউনলোড সমস্যা:", err);
      return message.reply("❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।");
    }

    return;
  }

  // সার্চ কুয়েরি হ্যান্ডলিং
  const query = args.join(" ");
  if (!query) {
    return message.reply("❌ লিখুন:\n/tik <search text>");
  }

  try {
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const api = apis.data.alldl;

    const res = await axios.get(`${api}/tiktok/search?keywords=${encodeURIComponent(query)}`);
    console.log("📦 TikTok API রেসপন্স:", res.data);

    const videos = res.data?.data?.videos;

    if (!Array.isArray(videos) || videos.length === 0) {
      return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
    }

    searchResults[event.senderID] = videos.slice(0, 10);

    const list = videos.slice(0, 10).map((v, i) => `${i + 1}. ${v.title?.slice(0, 80) || "No Title"}`).join("\n\n");

    return message.reply(`🔍 "${query}" এর জন্য ভিডিওগুলো:\n\n${list}\n\n➡️ রিপ্লাই দিয়ে নাম্বার দিন যেকোনো ভিডিও প্লে করতে।`);
  } catch (e) {
    console.error("❌ সার্চ API সমস্যা:", e);
    return message.reply("❌ TikTok সার্ভার থেকে ডেটা আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
  }
};
