// autosend.js

module.exports.config = {
  name: "autosend",
  version: "1.0.1",
  author: "Shaon Ahmed",
  role: 0,
  usePrefix: false,
  description: "Automatically send messages + videos every hour",
  category: "system",
  usages: "/start (to enable autosend in chat)",
  cooldown: 5
};

const axios = require("axios");
const moment = require("moment-timezone");

const r = a => a[Math.floor(Math.random() * a.length)];

// টাইম কনফিগ (২৪ ঘন্টা)
const config = [
  "12:00:00 AM","1:00:00 AM","2:00:00 AM","3:00:00 AM","4:00:00 AM","5:00:00 AM",
  "6:00:00 AM","7:00:00 AM","8:00:00 AM","9:00:00 AM","10:00:00 AM","11:00:00 AM",
  "12:00:00 PM","1:00:00 PM","2:00:00 PM","3:00:00 PM","4:00:00 PM","5:00:00 PM",
  "6:00:00 PM","7:00:00 PM","8:00:00 PM","9:00:00 PM","10:00:00 PM","11:00:00 PM"
];

let chatIds = [];

module.exports.run = (bot) => {
  // ✅ /start কমান্ড
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!chatIds.includes(chatId)) {
      chatIds.push(chatId);
    }
    bot.sendMessage(chatId, "✅ Autosend system enabled!\nএখন থেকে নির্দিষ্ট সময়ে মেসেজ + ভিডিও আসবে।");
  });

  // প্রতি সেকেন্ডে চেক
  setInterval(async () => {
    const now = moment().tz("Asia/Dhaka").format("h:mm:ss A");

    if (config.includes(now)) {
      try {
        const res = await axios.get("https://noobs-api-sable.vercel.app/video/status2");
        const videoData = res.data.data;

        // videoData safe check
        const videoUrl = videoData.url || null;
        const videoTitle = videoData.title || "No title";

        const msgText = 
`🔔 ===『 AUTOSEND 』=== 🔔
━━━━━━━━━━━━━━━━
➝ Now Is: ${moment().tz("Asia/Dhaka").format("❰hh:mm:ss A❱ ⟬D/MM/YYYY⟭ (dddd)")}
💬: ${videoTitle}
━━━━━━━━━━━━━━━━━━
➝ AUTOMATIC SEND MESSAGE`;

        for (let id of chatIds) {
          await bot.sendMessage(id, msgText);
          if (videoUrl) {
            await bot.sendVideo(id, videoUrl);
          }
        }
      } catch (e) {
        console.error("AutoSend error:", e.message);
      }
    }
  }, 1000);
};
