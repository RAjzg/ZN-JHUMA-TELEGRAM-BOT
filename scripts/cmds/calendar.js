const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "calendar",
  version: "11.9.8",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Show stylish calendar with image and inline refresh button",
  category: "calendar",
  usages: "/calendar",
  cooldowns: 30,
};

module.exports.run = async function ({ bot, msg }) {
  const chatId = msg.chat.id;

  const sendCalendar = async () => {
    try {
      const date = moment().tz("Asia/Dhaka");
      const day = date.format("dddd");
      const month = date.format("MMMM");
      const year = date.format("YYYY");
      const numDate = date.format("DD");
      const time = date.format("h:mm A");

      const captionMsg = `
「 Stylish Calendar 」
📅 ইংরেজি তারিখ: ${numDate}
📆 মাস: ${month}
📌 দিন: ${day}
🗓️ সাল: ${year}
⏰ সময়: ${time}

─── SHAON AHMED ───
      `;

      const url = `https://api.popcat.xyz/calendar?month=${date.format("M")}&year=${year}`;
      const response = await axios.get(url, { responseType: "arraybuffer" });

      const cacheDir = path.join(__dirname, "caches");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const filePath = path.join(cacheDir, `calendar_${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      const inlineKeyboard = {
        inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "calendar_refresh" }]]
      };

      await bot.sendPhoto(chatId, fs.createReadStream(filePath), {
        caption: captionMsg,
        reply_markup: inlineKeyboard,
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Calendar Error:", err);
      const errorMsg = `❌ Calendar দেখাতে সমস্যা হয়েছে!\n\nError: ${err.message || err}`;
      await bot.sendMessage(chatId, errorMsg);
    }
  };

  await sendCalendar();
};

// ✅ Callback query handle করা (Telegram)
module.exports.handleCallback = async function ({ bot, event }) {
  if (event.data === "calendar_refresh") {
    const chatId = event.message.chat.id;
    await module.exports.run({ bot, msg: { chat: { id: chatId }, text: "/calendar" } });
  }
};
