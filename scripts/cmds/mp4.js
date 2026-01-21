const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

// 🖼️ তোমার Imgur image
const IMAGE_URL = "https://i.imgur.com/dr1xRsK.jpeg";

module.exports = {
  config: {
    name: "mp4",
    version: "2.0.0",
    role: 0,
    credits: "Shaon Ahmed",
    description: "Audio/mp3 → mp4 (Imgur image + audio)",
    category: "media",
    usages: "/mp4 (reply audio)",
    cooldowns: 5,
  },

  run: async function ({ bot, msg }) {
    const chatId = msg.chat.id;

    if (!msg.reply_to_message || !msg.reply_to_message.audio) {
      return bot.sendMessage(
        chatId,
        "⚠️ কোনো অডিওতে reply করে /mp4 লিখুন।"
      );
    }

    try {
      const timestamp = Date.now();

      // ✅ EXTENSION FIX
      const audioPath = path.join(__dirname, `audio_${timestamp}.mp3`);
      const imagePath = path.join(__dirname, `image_${timestamp}.jpg`);
      const outputPath = path.join(__dirname, `NURNOBI_${timestamp}.mp4`);

      // ⬇️ Download image
      const imgRes = await axios({
        url: IMAGE_URL,
        method: "GET",
        responseType: "stream",
      });

      await new Promise((resolve, reject) => {
        const w = fs.createWriteStream(imagePath);
        imgRes.data.pipe(w);
        w.on("finish", resolve);
        w.on("error", reject);
      });

      // ⬇️ Download audio
      const fileId = msg.reply_to_message.audio.file_id;
      const fileLink = await bot.getFileLink(fileId);

      const audioRes = await axios({
        url: fileLink,
        method: "GET",
        responseType: "stream",
      });

      await new Promise((resolve, reject) => {
        const w = fs.createWriteStream(audioPath);
        audioRes.data.pipe(w);
        w.on("finish", resolve);
        w.on("error", reject);
      });

      // 🎬 image + audio → mp4
      ffmpeg()
        .input(imagePath)
        .inputOptions(["-loop 1"])
        .input(audioPath)
        .outputOptions([
          "-c:v libx264",
          "-c:a aac",
          "-shortest",
          "-pix_fmt yuv420p",
        ])
        .save(outputPath)
        .on("end", () => {
          bot.sendVideo(chatId, outputPath, {
            caption: "✅ MP3 ➜ MP4 SUCCESS\n👑 MD NURNOBI HAQUE",
            reply_to_message_id: msg.message_id,
          }).then(() => {
            fs.unlinkSync(imagePath);
            fs.unlinkSync(audioPath);
            fs.unlinkSync(outputPath);
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg ERROR FULL LOG:", err);
          bot.sendMessage(chatId, "❌ mp4 তৈরি করতে সমস্যা হয়েছে।");
        });

    } catch (err) {
      console.error("GENERAL ERROR:", err);
      bot.sendMessage(chatId, "❌ কিছু সমস্যা হয়েছে!");
    }
  },
};
