const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tiktok",
  version: "1.1.0",
  role: 0,
  credits: "Shaon Ahmed",
  description: "Search and send TikTok video based on query",
  category: "media",
  usages: "/tiktok <search text>",
  cooldowns: 5,
};

module.exports.run = async function ({ message, args }) {
  const query = args.join(" ");
  if (!query) {
    return message.reply("❌ লিখুন:\n/tiktok <search text>");
  }

  try {
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.alldl;

    const res = await axios.get(`${Shaon}/tiktok/search?keywords=${encodeURIComponent(query)}`);
    const videos = res.data?.data?.videos;

    if (!Array.isArray(videos) || videos.length === 0) {
      return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
    }

    const video = videos[0]; // চাইলে Math.random() দিতে পারেন
    const videoUrl = video.play;
    if (!videoUrl) {
      return message.reply("❌ ভিডিও URL পাওয়া যায়নি।");
    }

    const filePath = path.join(__dirname, "caches", `tiktok_${Date.now()}.mp4`);

    const videoResp = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    fs.writeFileSync(filePath, Buffer.from(videoResp.data));

    const caption =
      `🎵 𝗧𝗶𝗸𝗧𝗼𝗸 𝗦𝗲𝗮𝗿𝗰𝗵 🎵\n` +
      `👤 𝗔𝘂𝘁𝗵𝗼𝗿: ${video.author?.nickname || "N/A"}\n` +
      `🔗 𝗨𝘀𝗲𝗿: @${video.author?.unique_id || "N/A"}\n` +
      `🎬 𝗧𝗶𝘁𝗹𝗲: ${video.title || "N/A"}`;

    message.stream({
      url: fs.createReadStream(filePath),
      caption: caption,
    });

    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 10000);

  } catch (e) {
    console.error(e);
    message.reply("❌ টিকটক ভিডিও আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
  }
};
