const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sd",
    version: "2.0",
    author: "Shaon",
    description: "Find song from video link and download audio/video",
    category: "media",
    use: "<video link>",
  },

  onStart: async function ({ message, args, event }) {
    const link = args.join(" ");
    if (!link || !/^https?:\/\//.test(link)) {
      return message.reply("📌 Reply with or send a valid video link (e.g. TikTok, Facebook, etc.).");
    }

    try {
      const encoded = encodeURIComponent(link);
      const searchRes = await axios.get(`http://65.109.80.126:20392/nayan/song?url=${encoded}`);
      const results = searchRes.data;

      if (!results || results.length === 0) {
        return message.reply("❌ No result found from this video.");
      }

      const list = results
        .map((item, index) => `${index + 1}. ${item.title}\n⏱ Duration: ${item.length}`)
        .join("\n\n");

      message.reply(`🎧 Select a song by replying 1/2/3...\n\n${list}`, async (err, info) => {
        global.replyData.set(info.message_id, {
          name: this.config.name,
          author: event.sender_id,
          step: "select",
          results,
        });
      });
    } catch (err) {
      console.error(err);
      message.reply("⚠️ Error fetching song info.");
    }
  },

  onReply: async function ({ message, event, Reply }) {
    if (event.sender_id !== Reply.author) return;
    const choice = parseInt(event.body.trim());
    if (isNaN(choice) || choice < 1 || choice > Reply.results.length) {
      return message.reply("❌ Invalid number. Please reply with a valid choice.");
    }

    const selected = Reply.results[choice - 1];
    const encodedUrl = encodeURIComponent(selected.url);

    message.reply(`✅ You selected:\n${selected.title}\n\n🎵 Reply:\n1 - Audio\n2 - Video`, async (err, info) => {
      global.replyData.set(info.message_id, {
        name: module.exports.config.name,
        author: event.sender_id,
        step: "download",
        ytUrl: encodedUrl,
        title: selected.title,
      });
    });
  },

  onReplyStep: async function ({ message, event, Reply }) {
    if (event.sender_id !== Reply.author) return;
    const reply = event.body.trim();
    if (reply !== "1" && reply !== "2") {
      return message.reply("❗ Reply 1 for audio or 2 for video.");
    }

    const type = reply === "1" ? "audio" : "video";

    try {
      const res = await axios.get(`https://nayan-video-downloader.vercel.app/ytdown?url=${Reply.ytUrl}`);
      const data = res.data?.data;

      if (!data || !data.video) {
        return message.reply("⚠️ Failed to fetch download URL.");
      }

      const url = data.video;
      const ext = type === "audio" ? "mp3" : "mp4";
      const fileName = `caches/${Date.now()}.${ext}`;

      const fileData = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(fileName, fileData.data);

      await message.send({
        body: `✅ Here is your ${type}:\n${Reply.title}`,
        attachment: fs.createReadStream(fileName),
      });

      fs.unlinkSync(fileName);
    } catch (e) {
      console.error(e);
      message.reply("❌ Error while downloading the file.");
    }
  },
};
