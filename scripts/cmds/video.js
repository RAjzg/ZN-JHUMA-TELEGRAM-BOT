const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const { URL } = require("url");

const cache = new Map();

module.exports.config = {
  name: "video",
  aliases: [],
  role: 0,
  description: "Download YouTube video or audio by name or URL",
  guide: "/video tum hi ho\n/video -v https://youtu.be/abc123\n/video -a https://youtu.be/abc123",
  type: "anyone",
  prefix: true,
  cooldown: 5,
  category: "music"
};

module.exports.run = async function ({ bot, message, msg, args }) {
  const apiKey = "itzaryan";
  let type = "video";
  let videoId, topResult;

  if (!args.length) {
    return message.reply("❗ Please enter a YouTube URL or song name.\n\nExample:\n/video tum hi ho\n/video -v https://youtu.be/abc123");
  }

  const loading = await message.reply("📥 Fetching your media, please wait...");

  try {
    const mode = args[0];
    const inputArg = args[1];

    // Mode: URL based
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
      // Mode: Search by name
      const query = args.join(" ");
      const results = await ytSearch(query);
      if (!results?.videos?.length) throw new Error("❌ No results found.");

      const top5 = results.videos.slice(0, 5);
      let listText = `🎶 Select the song by replying with number (1-5):\n\n`;
      top5.forEach((v, i) => {
        listText += `${i + 1}. ${v.title} (${v.timestamp})\n`;
      });

      cache.set(msg.chat.id, { type: "video", list: top5, user_id: msg.from.id });
      await bot.sendMessage(msg.chat.id, listText, { reply_to_message_id: msg.message_id });
      return;
    }

    await sendDownload(bot, msg, topResult, type, loading.message_id);

  } catch (err) {
    console.error("Video command error:", err.message);
    return message.reply(`❌ Error: ${err.message}`);
  }
};

// REPLY handler
module.exports.reply = async function ({ bot, message, msg }) {
  const selected = parseInt(msg.text);
  const cached = cache.get(msg.chat.id);
  if (!cached || !cached.list || isNaN(selected) || selected < 1 || selected > cached.list.length) {
    return;
  }

  const topResult = cached.list[selected - 1];
  const loading = await bot.sendMessage(msg.chat.id, "📥 Downloading, please wait...", { reply_to_message_id: msg.message_id });

  try {
    await sendDownload(bot, msg, topResult, cached.type, loading.message_id);
  } catch (e) {
    console.error(e);
    await bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
  } finally {
    cache.delete(msg.chat.id);
  }
};

// Utility to send download
async function sendDownload(bot, msg, topResult, type, loadingId) {
  const videoId = topResult.videoId;
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
  if (!data.url) throw new Error("❌ Download URL not found in response.");

  const response = await axios.get(data.url, { responseType: "arraybuffer" });
  const cleanTitle = data.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
  const ext = type === "audio" ? "mp3" : "mp4";
  const filename = `${cleanTitle}.${ext}`;
  const filePath = path.join(__dirname, filename);

  fs.writeFileSync(filePath, response.data);

  const caption = `${type === "audio" ? "🎵 *AUDIO INFO*" : "🎬 *VIDEO INFO*"}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📌 *Title:* ${data.title}\n` +
    `🎞 *Duration:* ${topResult.timestamp}\n` +
    `📺 *Channel:* ${topResult.author.name}\n` +
    `👁 *Views:* ${topResult.views.toLocaleString()}\n` +
    `📅 *Uploaded:* ${topResult.ago}`;

  await bot.sendDocument(msg.chat.id, fs.createReadStream(filePath), {
    caption,
    parse_mode: "Markdown"
  });

  fs.unlinkSync(filePath);
  await bot.deleteMessage(msg.chat.id, loadingId);
}
