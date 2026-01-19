module.exports.config = {
  name: "videomix",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat",
  prefix: true,
  description: "videomix love story video",
  category: "video",
  usages: "videomix",
  cooldowns: 30,
};

module.exports.run = async function ({ api, message }) {
  try {
    const axios = require("axios");
    const fs = require("fs");
    
    // মূল API লিংক
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
    );
    const baseUrl = data.api;

    // ভিডিও ক্যাটাগরি API লিংক লিস্ট
    const apiList = [
      `${baseUrl}/video/status`,
      `${baseUrl}/video/sad`,
      `${baseUrl}/video/baby`,
      `${baseUrl}/video/love`,
      `${baseUrl}/video/ff`,
      `${baseUrl}/video/shairi`,
      `${baseUrl}/video/humaiyun`,
      `${baseUrl}/video/kosto`,
      `${baseUrl}/video/anime`,
      `${baseUrl}/video/short`,
      `${baseUrl}/video/event`,
      `${baseUrl}/video/prefix`,
      `${baseUrl}/video/cpl`,
      `${baseUrl}/video/time`,
      `${baseUrl}/video/lofi`,
      `${baseUrl}/video/happy`,
      `${baseUrl}/video/football`,
      `${baseUrl}/video/funny`,
      `${baseUrl}/video/sex`,
      `${baseUrl}/video/hot`,
      `${baseUrl}/video/item`,
      `${baseUrl}/video/capcut`,
      `${baseUrl}/video/sex2`,
      `${baseUrl}/video/sex3`,
      `${baseUrl}/video/horny`,
      `${baseUrl}/video/status2`,
      `${baseUrl}/video/status3`,
      `${baseUrl}/video/status4`
    ];

    // র‍্যান্ডম একটি API বেছে নেওয়া
    const apiUrl = apiList[Math.floor(Math.random() * apiList.length)];
    const res = await axios.get(apiUrl);
    
    // ভিডিও লিংক ঠিকভাবে পাওয়া যাচ্ছে কিনা চেক
    let videoUrl;

    if (typeof res.data.data === "string") {
      videoUrl = res.data.data; // যদি সরাসরি URL হয়
    } else if (typeof res.data.data === "object") {
      // যদি object থাকে এবং সেখানে url থাকে
      if (res.data.data.url) {
        videoUrl = res.data.data.url;
      } else if (res.data.url && res.data.url.url) {
        // কিছু ক্ষেত্রে data.url.url ফর্ম্যাটে থাকতে পারে
        videoUrl = res.data.url.url;
      } else {
        throw new Error("❌ ভিডিও URL খুঁজে পাওয়া যায়নি!");
      }
    } else {
      throw new Error("❌ অজানা response format!");
    }

    // ভিডিও ডাউনলোড
    const vid = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const filePath = __dirname + "/caches/video.mp4";
    fs.writeFileSync(filePath, Buffer.from(vid.data, "utf-8"));

    message.stream({
      url: fs.createReadStream(filePath),
      caption: `𝐒𝐏𝐀𝐘𝐒𝐇𝐄𝐀𝐋 𝐑𝐀𝐍𝐃𝐎𝐌 𝐌𝐈𝐗\n${res.data.shaon || ''}\n𝚃𝙾𝚃𝙰𝙻 𝚅𝙸𝙳𝙴𝙾: ${res.data.count || '❓'} 🎬\n\n｢𝐌𝐃 𝐍𝐔𝐑𝐍𝐎𝐁𝐈 𝐇𝐀𝐐𝐈𝐄｣`,
    });

    // অপশনালি: ভিডিও ফাইল ডিলিট করতে চাইলে নিচের লাইন আনকমেন্ট করো
    // fs.unlinkSync(filePath);

  } catch (e) {
    message.reply("⚠️ Error: " + e.message);
  }
};
