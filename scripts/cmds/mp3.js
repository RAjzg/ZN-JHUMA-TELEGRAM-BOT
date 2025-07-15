const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  config: {
    name: "mp3",
    version: "1.0.0",
    role: 0,
    credits: "Shaon Ahmed",
    description: "ভিডিও থেকে অডিও বানাও (mp4 → mp3)",
    category: "media",
    usages: "/mp3 (reply any video)",
    cooldowns: 5,
  },

  run: async function({ bot, msg }) {
    const chatId = msg.chat.id;

    // reply আছে কিনা এবং reply তে video আছে কিনা চেক করো
    if (!msg.reply_to_message || !msg.reply_to_message.video) {
      return bot.sendMessage(chatId, "⚠️ ভিডিওতে reply দিয়ে /mp3 কমান্ড দিন।");
    }

    try {
      const fileId = msg.reply_to_message.video.file_id;

      // Telegram থেকে ভিডিওর download link নেয়া
      const fileLink = await bot.getFileLink(fileId);

      // ফাইলের জন্য ইউনিক নাম তৈরি
      const timestamp = Date.now();
      const inputPath = path.join(__dirname, `input_${timestamp}.mp4`);
      const outputPath = path.join(__dirname, `output_${timestamp}.mp3`);

      // ভিডিও ডাউনলোড করা
      const response = await axios({
        url: fileLink.href,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(inputPath);
      response.data.pipe(writer);

      // ডাউনলোড শেষ হলে ffmpeg চালানো
      writer.on("finish", () => {
        ffmpeg(inputPath)
          .output(outputPath)
          .audioCodec("libmp3lame")
          .on("end", () => {
            // mp3 পাঠানো
            bot.sendAudio(chatId, outputPath, {
              caption: "✅ ভিডিও থেকে mp3 তৈরি হয়েছে।",
              reply_to_message_id: msg.message_id,
            }).then(() => {
              // কাজ শেষ, ফাইল মুছে ফেলা
              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);
            });
          })
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            bot.sendMessage(chatId, "❌ অডিও কনভার্ট করতে সমস্যা হয়েছে।");
          })
          .run();
      });

      writer.on("error", (err) => {
        console.error("Download error:", err);
        bot.sendMessage(chatId, "❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।");
      });
    } catch (error) {
      console.error("General error:", error);
      bot.sendMessage(chatId, "❌ কিছু সমস্যা হয়েছে।");
    }
  },
};
