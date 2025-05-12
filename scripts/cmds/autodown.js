const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
`https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json`
  );
  return base.data.ytdown;
};

module.exports.config = {
  name: "autodown",
  version: "1.0.1",
  author: "Dipto",
  countDown: 0,
  role: 0,
  description: {
    en: "Auto download video from TikTok, Facebook, Instagram, YouTube, and more",
  },
  category: "𝗠𝗘𝗗𝗜𝗔",
  commandCategory: "𝗠𝗘𝗗𝗜𝗔",
  guide: {
    en: "[video_link]",
  },
};

module.exports.run = async ({ event,bot, msg }) => {
  this.onChat({ event,bot, msg });
};

module.exports.onChat = async ({ event,bot, msg }) => {
  const messageText = msg.link_preview_options?.url || msg.text || "";

  try {
    if (
      messageText.startsWith("https://vt.tiktok.com") ||
      messageText.startsWith("https://www.tiktok.com/") ||
      messageText.startsWith("https://www.facebook.com") ||
      messageText.startsWith("https://www.instagram.com/") ||
      messageText.startsWith("https://x.com/") ||
      messageText.startsWith("https://www.twitch.tv/")
|| messageText.startsWith("https://www.instagram.com/p/") ||
      messageText.startsWith("https://pin.it/") ||
      messageText.startsWith("https://twitter.com/") ||
      messageText.startsWith("https://vm.tiktok.com") ||
      messageText.startsWith("https://fb.watch")
    )
    {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const Shaon = apis.data.api

      const wait = await bot.sendMessage(chatId, "⏳ Processing your request...", {
        reply_to_message_id: messageId,
      });
// Store the ID of the "processing" message//
      const waitMId = wait.message_id; 
      const videoPath = path.join(__dirname, "caches", "diptoo.mp4");

      const { data } = await axios.get(
        `${await baseApiUrl()}/yt?url=${encodeURIComponent(messageText)}`
      );
      const videoBuffer = (
        await axios.get(data.url, { responseType: "arraybuffer" })
      ).data;

      fs.writeFileSync(videoPath, Buffer.from(videoBuffer, "utf-8"));

      // Delete the "processing" message///
     
 await bot.deleteMessage(chatId, waitMId)
 
 const tinyUrlRes = await axios.get(`${Shaon}/tinyurl?url=${encodeURIComponent(data.url)`);
      const shortUrl = tinyUrlRes.data.url;

      const speed = "100 ms";

      const bodyText = 
`╭━━━[ ✅ 𝗠𝗲𝗱𝗶𝗮 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗱 ]━━━╮
┃ 🎬 Type: Video
┃ ⚡ Speed: ${speed}s
┃ 🔗 Link: ${shortUrl}
┃ 👤 Requested by: ${event.from.id}
╰━━━━━━━━━━━━━━━━━━━━━━╯
𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐯𝐢𝐝𝐞𝐨!.`;


      await bot.sendVideo(
        chatId,
        videoPath,
        {
          caption: `${bodyText}`,
          reply_to_message_id: messageId,
        },
        {
          filename: "video.mp4",
          contentType: "video/mp4",
        },
      );

      fs.unlinkSync(videoPath);
    }
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❎ Error: ${error.message}`);
  }
};
