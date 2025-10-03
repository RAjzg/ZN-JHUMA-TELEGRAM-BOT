const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "random",
  version: "11.9.9",
  role: 0,
  credits: "Islamick Cyber Chat (Modified by Shaon)",
  description: "Get a random or named love story video or image",
  commandCategory: "media",
  usages: "random [name]",
  cooldowns: 30
};

module.exports.run = async function ({ api, message, args }) {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const base = data.api;

    // যদি নাম দেয়, তাহলে name param যুক্ত করো, না দিলে random
    const query = args.length > 0 
      ? `${base}/video/random?name=${encodeURIComponent(args.join(" "))}` 
      : `${base}/video/random`;

    const res = await axios.get(query);
    if (!res.data?.url) return message.reply("❌ মিডিয়া পাওয়া যায়নি, নামটি সঠিক কিনা চেক করুন।");

    const mediaUrl = res.data.url;
    const ext = path.extname(mediaUrl).toLowerCase(); // .mp4, .jpg, .png ইত্যাদি
    const filePath = path.join(__dirname, "caches", `media${ext}`);

    const media = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    fs.writeFileSync(filePath, Buffer.from(media.data));

    // ভিডিও বা ছবি পাঠানো
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
