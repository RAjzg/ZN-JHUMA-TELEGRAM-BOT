// autosend.js

module.exports.config = {
  name: "autosend",
  version: "1.0.0",
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

const config = [
  { timer: "12:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "1:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "2:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "3:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "4:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "5:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "6:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "7:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "8:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "9:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "10:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "11:00:00 AM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "12:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "1:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "2:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "3:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "4:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "5:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "6:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "7:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "8:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "9:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "10:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] },
  { timer: "11:00:00 PM", message: ["🔔 ===『 AUTOSEND 』=== 🔔\n━━━━━━━━━━━━━━━━\n➝ Now Is: {time}\n\n💬: {thinh}\n━━━━━━━━━━━━━━━━━━\n➝ AUTOMATIC SEND MESSAGE"] }
];

let chatIds = [];

module.exports.run = (bot) => {
  // যখন ইউজার /start দিবে
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!chatIds.includes(chatId)) chatIds.push(chatId);
    bot.sendMessage(chatId, "✅ Autosend system enabled! এখন থেকে নির্দিষ্ট সময়ে মেসেজ আসবে।");
  });

  // Timer checker
  setInterval(async () => {
    const now = moment().tz("Asia/Dhaka").format("h:mm:ss A");
    const match = config.find(i => i.timer === now);

    if (match) {
      try {
        const res = await axios.get("https://video-api-5i3d.onrender.com/video/status3");
        const videoData = res.data.url;

        let msgText = r(match.message);
        msgText = msgText
          .replace(/{time}/g, moment().tz("Asia/Dhaka").format("❰hh:mm:ss A❱ ⟬D/MM/YYYY⟭ (dddd)"))
          .replace(/{thinh}/g, videoData.title);

        for (let id of chatIds) {
          await bot.sendMessage(id, msgText);
          await bot.sendVideo(id, videoData.url);
        }
      } catch (e) {
        console.error("AutoSend error:", e.message);
      }
    }
  }, 1000);
};
