const fs = require("fs");
const path = require("path");
const googleTTS = require("google-tts-api");

module.exports = {
  config: {
    name: "say",
    version: "1.0.0",
    role: 0,
    credits: "Shaon Ahmed",
    description: "বাংলা লেখা থেকে ভয়েস বানাও",
    category: "utility",
    usages: "/say [বাংলা টেক্সট]",
    cooldowns: 3,
  },

  run: async function ({ bot, msg }) {
    const chatId = msg.chat.id;
    const text = msg.text.split(" ").slice(1).join(" ");

    if (!text) {
      return bot.sendMessage(chatId, "❌ ব্যবহার: /say [বাংলা টেক্সট]");
    }

    try {
      const url = googleTTS.getAudioUrl(text, {
        lang: "bn",
        slow: false,
      });

      const filePath = path.join(__dirname, `say_${Date.now()}.mp3`);
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));

      await bot.sendVoice(chatId, filePath, {
        caption: "🎤 বাংলা ভয়েস রেডি!",
        reply_to_message_id: msg.message_id,
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ ভয়েস তৈরি করতে সমস্যা হয়েছে।");
    }
  },
};
