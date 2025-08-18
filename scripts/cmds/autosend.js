// autosend.js

module.exports.config = {
  name: "autosend",
  version: "1.0.2",
  author: "Shaon Ahmed",
  role: 0,
  usePrefix: false,
  description: "Automatically send messages + videos every hour in all chats",
  category: "system",
  usages: "auto (always on, no command needed)",
  cooldown: 5
};

const axios = require("axios");
const moment = require("moment-timezone");

const r = a => a[Math.floor(Math.random() * a.length)];

// প্রতি ঘন্টার টাইম লিস্ট
const config = [
  "12:00:00 AM","1:00:00 AM","2:00:00 AM","3:00:00 AM","4:00:00 AM","5:00:00 AM",
  "6:00:00 AM","7:00:00 AM","8:00:00 AM","9:00:00 AM","10:00:00 AM","11:00:00 AM",
  "12:00:00 PM","1:00:00 PM","2:00:00 PM","3:00:00 PM","4:00:00 PM","5:00:00 PM",
  "6:00:00 PM","7:00:00 PM","8:00:00 PM","9:00:00 PM","10:00:00 PM","11:00:00 PM"
];

// যেসব চ্যাটে বট অ্যাড আছে সেগুলো অটো সেভ হবে
let allChats = new Set();

module.exports.run = (bot) => {
  // নতুন মেসেজ পেলেই চ্যাট লিস্টে যোগ হবে
  bot.on("message", (msg) => {
    allChats.add(msg.chat.id);
  });

  // প্রতি সেকেন্ডে টাইম চেক
  setInterval(async () => {
    const now = moment().tz("Asia/Dhaka").format("h:mm:ss A");

    if (config.includes(now)) {
      try {
        const res = await axios.get("https://noobs-api-sable.vercel.app/video/status2");
        const videoData = res.data.data;

        const videoUrl = videoData.url || null;
        const videoTitle = videoData.title || "Auto Message";

        const msgText = 
`🔔 ===『 AUTOSEND 』=== 🔔
━━━━━━━━━━━━━━━━
➝ Now Is: ${moment().tz("Asia/Dhaka").format("❰hh:mm:ss A❱ ⟬D/MM/YYYY⟭ (dddd)")}
💬: ${videoTitle}
━━━━━━━━━━━━━━━━━━
➝ AUTOMATIC SEND MESSAGE`;

        for (let id of allChats) {
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
