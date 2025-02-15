const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "fb",
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

module.exports.run = async ({ bot, msg }) => {
  this.onChat({ bot, msg });
};

module.exports.onChat = async ({ bot, msg }) => {
  const messageText = msg.link_preview_options?.url || msg.text || "";

  try {
    if (
      messageText.startsWith("https://www.facebook.com") ||
      messageText.startsWith("https://fb.watch")
    ) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const Shaon = apis.data.sim

      const wait = await bot.sendMessage(chatId, "⏳ Processing your request...", {
        reply_to_message_id: messageId,
      });
// Store the ID of the "processing" message//
      const waitMId = wait.message_id; 
      const videoPath = path.join(__dirname, "caches", "diptoo.mp4");

      const res = await axios.get(
        `${Shaon}/fbdl?url=${encodeURIComponent(messageText)}`
      );
        
      const videoBuffer = (
        await axios.get(res.data.hd, { responseType: "arraybuffer" })
      ).data;

      fs.writeFileSync(videoPath, Buffer.from(videoBuffer, "utf-8"));

      // Delete the "processing" message///
 await bot.deleteMessage(chatId, waitMId);

      await bot.sendVideo(
        chatId,
        videoPath,
        {
          caption: `🔰Downloaded Facebook Video✅`,
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
