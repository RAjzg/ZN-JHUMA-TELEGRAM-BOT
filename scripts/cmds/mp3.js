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

  run: async function ({ bot, msg }) {
    const chatId = msg.chat.id;

    // ইউজার যদি কোনো ভিডিওতে reply না দেয়
    if (!msg.reply_to_message || !msg.reply_to_message.video) {
      return bot.sendMessage(chatId, "⚠️ কোনো ভিডিওতে reply করে /mp3 লিখুন।");
    }

    try {
      const fileId = msg.reply_to_message.video.file_id;
      const fileLink = await bot.getFileLink(fileId); // এটি একটা string (URL)

      const timestamp = Date.now();
      const inputPath = path.join(__dirname, `input_${timestamp}.mp4`);
      const outputPath = path.join(__dirname, `Shaon_${timestamp}.mp3`);

      // ভিডিও ডাউনলোড
      const response = await axios({
        url: fileLink, // ✅ এখানে .href নয়
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(inputPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        // ভিডিও → অডিও কনভার্ট
        ffmpeg(inputPath)
          .output(outputPath)
          .audioCodec("libmp3lame")
          .on("end", () => {
            // mp3 পাঠাও
            bot.sendAudio(chatId, outputPath, {
              caption: "✅𝐙𝐍 𝐉𝐇𝐔𝐌𝐀  😒𝐑𝐎𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑:-𝐌𝐃:𝐍𝐔𝐑𝐍𝐎𝐁𝐈 𝐇𝐀𝐐𝐔𝐄  🙃 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋 𝐘𝐎𝐔𝐑 𝐌𝐏4 𝐓𝐎 𝐌𝐏3  𝐌𝐔𝐒𝐈𝐂",
              reply_to_message_id: msg.message_id,
            }).then(() => {
              // টেম্প ফাইল ডিলিট
              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);
            });
          })
          .on("error", (err) => {
            console.error("FFmpeg Error:", err);
            bot.sendMessage(chatId, "❌ অডিও কনভার্ট করতে সমস্যা হয়েছে।");
          })
          .run();
      });

      writer.on("error", (err) => {
        console.error("Download Error:", err);
        bot.sendMessage(chatId, "❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।");
      });
    } catch (err) {
      console.error("General error:", err);
      bot.sendMessage(chatId, "❌ কিছু সমস্যা হয়েছে।");
    }
  },
};
