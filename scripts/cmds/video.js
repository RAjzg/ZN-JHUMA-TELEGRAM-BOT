const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const { URL } = require("url");

module.exports.config = {
  name: "video",
  aliases: [],
  role: 0,
  description: "Download YouTube video or audio by name or URL",
  guide: "/video leja re\n/video -v https://youtu.be/abc123\n/video -a https://youtu.be/abc123",
  type: "anyone",
  prefix: true,
  cooldown: 5,
  category: "music"
};

module.exports.run = async function ({ bot, message, msg, args }) {
  let type = "video";
  let videoId, topResult;

  if (!args.length) {
    return message.reply("❗ Please enter a YouTube URL or song name.\n\nExample:\n/video tum hi ho\n/video -v https://youtu.be/abc123");
  }

  const loading = await message.reply("📥 Fetching your media, please wait...");

  try {
    const mode = args[0];
    const inputArg = args[1];

    if ((mode === "-v" || mode === "-a") && inputArg) {
      type = mode === "-a" ? "audio" : "video";

      let urlObj;
      try {
        urlObj = new URL(inputArg);
      } catch {
        throw new Error("❌ Invalid YouTube URL.");
      }

      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes("youtube.com")) {
        videoId = new URLSearchParams(urlObj.search).get("v");
      }

      if (!videoId) throw new Error("❌ Couldn't extract video ID from the URL.");

      const results = await ytSearch(videoId);
      if (!results?.videos?.length) throw new Error("❌ Couldn't fetch video details.");
      topResult = results.videos[0];

    } else {
      const query = args.join(" ");
      const results = await ytSearch(query);
      if (!results?.videos?.length) throw new Error("❌ No results found.");
      topResult = results.videos[0];
      videoId = topResult.videoId;
    }

    const timestamp = topResult.timestamp || "0:00";
    const durationParts = timestamp.split(":").map(Number);
    const durationSec = durationParts.length === 3
      ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
      : durationParts[0] * 60 + durationParts[1];

    if (durationSec > 600) {
      throw new Error(`❌ This video is too long (${timestamp}). Max 10 minutes allowed.`);
    }

    const apiUrl = `https://noobs-api-sable.vercel.app/ytdl?url=https://www.youtube.com/watch?v=${videoId}&type=${type}`;
    const { data } = await axios.get(apiUrl);
    const response = await axios.get(data.download, { responseType: "arraybuffer" });

    const ext = type === "audio" ? "mp3" : "mp4";
    const cleanTitle = topResult.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
    const filename = `${cleanTitle}.${ext}`;
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, response.data);

    const caption = `${type === "audio" ? "🎵 *AUDIO INFO*" : "🎬 *VIDEO INFO*"}\n` +
                    `━━━━━━━━━━━━━━━\n` +
                    `📌 *Title:* ${topResult.title}\n` +
                    `🎞 *Duration:* ${topResult.timestamp}\n` +
                    `📺 *Channel:* ${topResult.author.name}\n` +
                    `👁 *Views:* ${topResult.views.toLocaleString()}\n` +
                    `📅 *Uploaded:* ${topResult.ago}`;

    await bot.sendDocument(msg.chat.id, fs.createReadStream(filePath), {
      caption,
      parse_mode: "Markdown"
    });

    fs.unlinkSync(filePath);
    await bot.deleteMessage(msg.chat.id, loading.message_id);

  } catch (err) {
    console.error("Video command error:", err.message);
    return message.reply(`❌ Error: ${err.message}`);
  }
};
