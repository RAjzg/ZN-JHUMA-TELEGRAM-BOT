// File: commands/toaudio.js
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
    usages: "/toaudio (reply any video)",
    cooldowns: 5,
  },

  run: async ({ api, event }) => {
    const { messageReply, threadID, messageID } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ এই কমান্ড ইউজ করতে হলে কোনো ভিডিওতে reply দিতে হবে।", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];
    if (attachment.type !== "video") {
      return api.sendMessage("❌ শুধু ভিডিও reply করলেই কাজ করবে।", threadID, messageID);
    }

    const videoUrl = attachment.url;
    const inputPath = path.join(__dirname, "input.mp4");
    const outputPath = path.join(__dirname, "output.mp3");

    // ভিডিও ডাউনলোড
    const response = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(inputPath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      // ভিডিও → mp3
      ffmpeg(inputPath)
        .output(outputPath)
        .audioCodec("libmp3lame")
        .on("end", () => {
          api.sendMessage(
            {
              body: "✅ অডিও প্রস্তুত ✅",
              attachment: fs.createReadStream(outputPath),
            },
            threadID,
            () => {
              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);
            }
          );
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          api.sendMessage("❌ কনভার্ট করতে সমস্যা হয়েছে।", threadID);
        })
        .run();
    });
  },
};
