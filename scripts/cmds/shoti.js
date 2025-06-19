const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "shoti",
  version: "1.0.3",
  role: 0,
  credits: "Shaon Ahmed",
  description: "Send a random shoti (TikTok short video)",
  category: "media",
  usages: "shoti",
  cooldowns: 5,
};

module.exports.run = async function ({ api, message }) {
  try {
    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const Shaon = apis.data.alldl
    
    const res = await axios.get(`${Shaon}/api/shoti`);
    let data = res.data;

    // যদি response অ্যারে হয়, তাহলে র্যান্ডম বা প্রথম এলিমেন্ট নাও
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return message.reply("❌ ভিডিও পাওয়া যায়নি!");
      }
      data = data[Math.floor(Math.random() * data.length)];
    }

    const videoUrl = data.shotiurl || data.url;
    if (!videoUrl) {
      return message.reply("❌ API did not return a video URL.");
    }

    // ভিডিও ডাউনলোডের জন্য ফাইলপাথ
    const filePath = path.join(__dirname, "caches", `shoti_${Date.now()}.mp4`);

    // ভিডিও ডাউনলোড (arraybuffer)
    const videoResp = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    // ভিডিও ফাইল লিখা
    fs.writeFileSync(filePath, Buffer.from(videoResp.data));

    // ক্যাপশন তৈরি
    const caption =
      `🎬 𝗧𝗶𝘁𝗹𝗲: ${data.title || "N/A"}\n` +
      `👤 𝗨𝘀𝗲𝗿: @${data.username || "N/A"}\n` +
      `📛 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲: ${data.nickname || "N/A"}\n` +
      `🌍 𝗥𝗲𝗴𝗶𝗼𝗻: ${data.region || "N/A"}\n` +
      `⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${data.duration || "N/A"} sec\n` +
      `👑 𝗢𝗽𝗲𝗿𝗮𝘁𝗼𝗿: ${data.operator || "N/A"}`;

    // message.stream দিয়ে ভিডিও পাঠানো
    message.stream({
      url: fs.createReadStream(filePath),
      caption: caption,
    });

    // ভিডিও পাঠানোর পর ফাইল ডিলিট করা (async তাই একটু ডিলে দাও)
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 10000); // 10 সেকেন্ড পরে ডিলিট

  } catch (e) {
    console.error(e);
    message.reply("❌ শটী ভিডিও আনতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
  }
};
