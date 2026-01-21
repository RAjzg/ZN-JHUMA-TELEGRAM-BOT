const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  config: {
    name: "mp4",
    version: "1.0.0",
    role: 0,
    credits: "Shaon Ahmed",
    description: "mp3 থেকে mp4 ভিডিও বানাও (ছবি + অডিও)",
    category: "media",
    usages: "/mp4 (reply any mp3)",
    cooldowns: 5,
  },

  run: async function ({ bot, msg }) {
    const chatId = msg.chat.id;

    // mp3 reply না হলে
    if (!msg.reply_to_message || !msg.reply_to_message.audio) {
      return bot.sendMessage(
        chatId,
        "⚠️ কোনো mp3 অডিওতে reply করে /mp4 লিখুন।"
      );
    }

    try {
      const fileId = msg.reply_to_message.audio.file_id;
      const fileLink = await bot.getFileLink(fileId);

      const timestamp = Date.now();
      const audioPath = path.join(__dirname, `audio_${timestamp}.mp3`);
      const outputPath = path.join(__dirname, `NURNOBI_${timestamp}.mp4`);
      const imagePath = path.join(__dirname, "cover.jpg");

      // mp3 ডাউনলোড
      const response = await axios({
        url: fileLink,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(audioPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        // ছবি + অডিও → mp4
        ffmpeg()
          .input(imagePath)
          .loop()
          .input(audioPath)
          .outputOptions([
            "-c:v libx264",
            "-c:a aac",
            "-b:a 192k",
            "-shortest",
            "-pix_fmt yuv420p",
          ])
          .save(outputPath)
          .on("end", () => {
            bot.sendVideo(chatId, outputPath, {
              caption:
                "✅ MP3 ➜ MP4 SUCCESS\n👑 ROBOT OWNER: MD NURNOBI HAQUE",
              reply_to_message_id: msg.message_id,
            }).then(() => {
              fs.unlinkSync(audioPath);
              fs.unlinkSync(outputPath);
            });
          })
          .on("error", (err) => {
            console.error("FFmpeg Error:", err);
            bot.sendMessage(chatId, "❌ mp4 তৈরি করতে সমস্যা হয়েছে।");
          });
      });

      writer.on("error", (err) => {
        console.error("Download Error:", err);
        bot.sendMessage(chatId, "❌ অডিও ডাউনলোড করতে সমস্যা হয়েছে।");
      });
    } catch (err) {
      console.error("General Error:", err);
      bot.sendMessage(chatId, "❌ কিছু সমস্যা হয়েছে।");
    }
  },
};
