const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "random",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat (Modified by Shaon)",
  description: "random love story video",
  commandCategory: "video",
  usages: "random",
  cooldowns: 30
};

module.exports.run = async function ({ api, message }) {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const video = data.api;
    const urlList = [`${video}/video/random`, `${video}/video/random`];
    const selectedUrl = urlList[Math.floor(Math.random() * urlList.length)];

    const res = await axios.get(selectedUrl);
    const vidUrl = res.data.url;

    const vid = await axios.get(vidUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const filePath = __dirname + "/caches/video.mp4";
    fs.writeFileSync(filePath, Buffer.from(vid.data, "utf-8"));

    message.stream({
      url: fs.createReadStream(filePath),
      caption:
        `${res.data.cp}\n\n` +
        `🔗 Video URL: ${res.data.url}\n` +
        `🎞️ Total Videos: [${res.data.count}]\n` +
        `🆔 Added by: ${res.data.name}`
    });

    // অপশনাল: ফাইল ডিলিট করতে চাইলে নিচের লাইন আনকমেন্ট করো
    // fs.unlinkSync(filePath);

  } catch (e) {
    message.reply("❌ Error: " + e.message);
  }
};
