const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 🔗 তোমার main API URL JSON থেকে নেয়া হবে
const baseApiUrl = async () => {
  const res = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
  return res.data.noobs;
};

module.exports.config = {
  name: "autodown",
  version: "1.0.2",
  author: "MD NURNOBI HAQUE",
  role: 0,
  usePrefix: false,
  description: "Automatically download videos from links"
};

module.exports.run = async () => {}; // dummy run()

module.exports.onChat = async ({ event, bot, msg }) => {
  const text = msg.text || "";
  const urlRegex = /https?:\/\/[^\s]+/;
  const match = text.match(urlRegex);
  if (!match) return;

  const mediaUrl = match[0];
  const supportedDomains = [
    "capcut", "facebook.com", "fb.watch", "instagram.com", "youtube.com",
    "youtu.be", "twitter.com", "x.com", "twitch.tv", "pin.it"
  ];

  if (!supportedDomains.some(domain => mediaUrl.includes(domain))) return;

  const chatId = msg.chat.id;
  const senderId = msg.from.id.toString();
  const messageId = msg.message_id;
  const startTime = Date.now();

  const cacheDir = path.join(__dirname, "../../caches");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const videoPath = path.join(cacheDir, `autodown_${Date.now()}.mp4`);

  try {
    const wait = await bot.sendMessage(chatId, "⏳ ভিডিও প্রসেস হচ্ছে...", {
      reply_to_message_id: messageId,
    });
    const waitMsgId = wait.message_id;

    const api = await baseApiUrl();
    const res = await axios.get(`${api}/alldown?url=${encodeURIComponent(mediaUrl)}`);
    const data = res.data;

    if (!data.url) throw new Error("ভিডিও লিংক পাওয়া যায়নি বা ডাউনলোড করা যাচ্ছে না।");

    const videoBuffer = (await axios.get(data.url, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(videoPath, videoBuffer);

    await bot.deleteMessage(chatId, waitMsgId);

    const shortRes = await axios.get(`${api}/tinyurl?url=${encodeURIComponent(data.url)}`);
    const shortUrl = shortRes.data.url || data.url;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const caption = `
╭━━━[ ✅ 𝗠𝗲𝗱𝗶𝗮 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 ]━━━╮
┃ 🎬 Type: Video
┃ ⚡ Time: ${elapsed}s
┃ 🔗 Short URL: ${shortUrl}
┃ 👤 Requested by: ${senderId}
╰━━━━━━━━━━━━━━━━━━━━━━╯
Enjoy your video!`;

    await bot.sendVideo(chatId, videoPath, {
      caption,
      reply_to_message_id: messageId,
    });

    fs.unlinkSync(videoPath);
  } catch (err) {
    console.error("❌ autodown error:", err.message);
    await bot.sendMessage(chatId, `❌ ভিডিও আনতে সমস্যা হয়েছে:\n${err.message}`, {
      reply_to_message_id: messageId,
    });
  }
};
