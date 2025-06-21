const axios = require("axios");
const fs = require("fs");
const path = require("path");

let searchResults = {};

module.exports.config = {
  name: "tik",
  version: "2.0.1",
  role: 0,
  credits: "Shaon Ahmed + ChatGPT",
  description: "Search TikTok and download using /tikdown API",
  category: "media",
  usages: "/tik <search> or reply with number",
  cooldowns: 5,
};

module.exports.run = async function ({ message, args, event }) {
  const body = event.body?.trim();

  // ইউজার যদি রিপ্লাই করে 1, 2, 3 ইত্যাদি
  if (/^\d+$/.test(body) && searchResults[event.senderID]) {
    const index = parseInt(body) - 1;
    const video = searchResults[event.senderID][index];

    if (!video) return message.reply("❌ ভুল নাম্বার দিয়েছেন।");

    const tiktokUrl = video.share_url || `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;
    const apiUrl = `https://noobs-api-sable.vercel.app/tikdown?url=${encodeURIComponent(tiktokUrl)}`;

    try {
      const res = await axios.get(apiUrl);
      if (!res.data || !res.data.video) {
        return message.reply("❌ ভিডিও ডাউনলোড করা যায়নি।");
      }

      const videoUrl = res.data.video;
      const filePath = path.join(__dirname, "caches", `tiktok_${Date.now()}.mp4`);

      const videoResp = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      fs.writeFileSync(filePath, Buffer.from(videoResp.data));

      const caption =
        `🎵 𝗧𝗶𝗸𝗧𝗼𝗸 𝗩𝗶𝗱𝗲𝗼 🎵\n` +
        `🎬 Title: ${res.data.title || "No Title"}\n` +
        `👤 Author: ${res.data.author || "Unknown"}`;

      await message.stream({
        url: fs.createReadStream(filePath),
        caption: caption
      });

      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 10000);
    } catch (e) {
      console.error("❌ ভিডিও সমস্যা:", e.message);
      return message.reply("❌ ভিডিও আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }

    return;
  }

  // যদি কেউ নতুন সার্চ দেয়
  const query = args.join(" ");
  if (!query) return message.reply("❌ লিখুন: /tik <search>");

  try {
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const api = apis.data.alldl;

    const res = await axios.get(`${api}/tiktok/search?keywords=${encodeURIComponent(query)}`);
    const videos = res.data?.data?.videos;

    if (!Array.isArray(videos) || videos.length === 0) {
      return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
    }

    searchResults[event.senderID] = videos.slice(0, 10);

    const list = videos
      .slice(0, 10)
      .map((v, i) => `${i + 1}. ${v.title?.slice(0, 100) || "No Title"}`)
      .join("\n\n");

    return message.reply(`🔍 "${query}" এর জন্য ভিডিওগুলো:\n\n${list}\n\n➡️ রিপ্লাই দিয়ে নাম্বার দিন যেকোনো ভিডিও আনতে।`);
  } catch (e) {
    console.error("❌ সার্চ সমস্যা:", e.message);
    return message.reply("❌ সার্ভার থেকে ডেটা আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
  }
};
