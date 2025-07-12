const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "random",
  version: "11.9.8",
  role: 0,
  credits: "Islamick Cyber Chat (Modified by Shaon)",
  description: "Get a random or named love story video",
  commandCategory: "video",
  usages: "random [name]",
  cooldowns: 30
};

module.exports.run = async function ({ api, message, args }) {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const base = data.api;

    // যদি নাম দেয়, তাহলে name param যুক্ত করো, না দিলে random
    const query = args.length > 0 ? `${base}/video/random?name=${encodeURIComponent(args.join(" "))}` : `${base}/video/random`;

    const res = await axios.get(query);
    if (!res.data?.url) return message.reply("❌ ভিডিও পাওয়া যায়নি, নামটি সঠিক কিনা চেক করুন।");

    const vidUrl = res.data.url;
    const filePath = path.join(__dirname, "caches", "video.mp4");

    const vid = await axios.get(vidUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    fs.writeFileSync(filePath, Buffer.from(vid.data, "utf-8"));

    message.stream({
      url: fs.createReadStream(filePath),
      caption:
        `${res.data.cp || "❤️ Love Story"}\n\n` +
        `🎞️ Total Videos: [${res.data.count || "N/A"}]\n` +
        `🆔 Added by: ${res.data.name || "Unknown"}`
    });

    // চাইলে পরে ডিলিট করতে পারো
    // fs.unlinkSync(filePath);

  } catch (e) {
    console.error(e);
    message.reply("❌ Error: " + e.message);
  }
};
