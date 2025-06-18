const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sd",
    version: "1.2",
    description: "YouTube downloader — audio or video",
    author: "Shaon x Nayan",
    role: 0,
    category: "media",
    usages: "[link]",
    cooldown: 5,
  },

  onStart: async function ({ message, event, args }) {
    const input =
      message.reply_to_message?.text?.trim() ||
      message.reply_to_message?.video?.file_id ||
      args.join(" ")?.trim();

    if (!input || (!input.includes("http") && !input.startsWith("www."))) {
      return message.reply("📌 Reply with or send a valid YouTube link.");
    }

    const url = encodeURIComponent(input);

    try {
      const searchRes = await axios.get(`http://65.109.80.126:20392/nayan/song?url=${url}`);
      const results = searchRes.data;

      if (!results || results.length === 0) {
        return message.reply("❌ No media found for this link.");
      }

      const info = results[0];
      const ytUrl = encodeURIComponent(info.url);

      // Store info in global map for follow-up reply
      global.sdTemp = global.sdTemp || {};
      global.sdTemp[event.sender_id] = {
        ytUrl,
        title: info.title || "Unknown Title",
      };

      return message.reply(`🎵 *${info.title}*\n\nReply with:\n1️⃣ for Audio\n2️⃣ for Video`);
    } catch (e) {
      console.error("Search error:", e.message);
      return message.reply("❌ Failed to fetch info.");
    }
  },

  onMessage: async function ({ message, event }) {
    const reply = message.text?.trim();

    if (!["1", "2"].includes(reply)) return;

    const data = global.sdTemp?.[event.sender_id];
    if (!data) return;

    const { ytUrl, title } = data;
    const type = reply === "1" ? "audio" : "video";

    delete global.sdTemp[event.sender_id];

    try {
      const dlRes = await axios.get(`https://nayan-video-downloader.vercel.app/ytdown?url=${ytUrl}`);
      const dlData = dlRes.data;

      if (!dlData?.status || !dlData?.data?.video) {
        return message.reply("❌ Failed to retrieve download URL.");
      }

      const dlUrl = dlData.data.video;
      const ext = type === "audio" ? "mp3" : "mp4";
      const fileName = `media_${Date.now()}.${ext}`;
      const filePath = path.join(__dirname, "caches", fileName);

      const stream = await axios.get(dlUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      stream.data.pipe(writer);

      writer.on("finish", async () => {
        await message.stream(fs.createReadStream(filePath), `✅ Here is your ${type}:\n${title}`);
        fs.unlinkSync(filePath);
      });

      writer.on("error", () => {
        message.reply("❌ Error saving the file.");
      });
    } catch (e) {
      console.error("Download error:", e.message);
      return message.reply("❌ An error occurred during download.");
    }
  },
};
