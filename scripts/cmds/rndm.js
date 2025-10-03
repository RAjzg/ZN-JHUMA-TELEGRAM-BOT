const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "rndm",
  version: "11.9.7",
  role: 0,
  credits: "Shaon Ahmed (Modified by Shaon Ahmed)",
  description: "নামের ভিত্তিতে র‍্যান্ডম লাভ স্টোরি ভিডিও পাঠায়",
  commandCategory: "video",
  usages: "rndm [name]\nউদাহরণ: rndm Shaon",
  cooldowns: 30
};

module.exports.run = async function ({ event, args, api, message }) {
  try {
    // ✨ ইনপুট নাম চেক
    const nameParam = args.join(" ").trim();
    if (!nameParam) {
      return message.reply("📌 ব্যবহার: rndm [name]\nউদাহরণ: rndm Shaon");
    }

    // 🔗 API কনফিগ আনছি
    const { data } = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const baseApi = data.api;

    // 🎯 ভিডিও ফেচ
    const res = await axios.get(`${baseApi}/video/random?name=${encodeURIComponent(nameParam)}`);
    const vidUrl = res.data.url;

    // ⬇️ ভিডিও ডাউনলোড
    const vidRes = await axios.get(vidUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const filePath = __dirname + "/caches/video.mp4";
    fs.writeFileSync(filePath, Buffer.from(vidRes.data, "binary"));

    // 📤 পাঠিয়ে দিচ্ছি
    message.stream({
      url: fs.createReadStream(filePath),
      caption:
        `${res.data.cp}\n\n` +
        `🔗 Video URL: ${res.data.url}\n` +
        `🎞️ Total Videos: [${res.data.count}]\n` +
        `🆔 Added by: ${res.data.name}`
    });

    // চাইলে ফাইল ডিলিট করতে নিচের লাইন আনকমেন্ট করো
    // fs.unlinkSync(filePath);

  } catch (e) {
    console.error(e);
    message.reply(`❌ Error: ${e.message}`);
  }
};
