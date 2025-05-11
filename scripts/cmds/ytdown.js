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
  name: "ytdown",
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
      messageText.startsWith("https://youtube.com/")
||
      messageText.startsWith("https://youtu.be/")
    )
    {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;

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
        await axios.get(data.url,
        { responseType: "arraybuffer" })
      ).data;

      fs.writeFileSync(videoPath, Buffer.from(videoBuffer, "utf-8"));

      // Delete the "processing" message///
 await bot.deleteMessage(chatId, waitMId)

      await bot.sendVideo(
        chatId,
        videoPath,
        {
          caption: `🔥🚀 𝙎𝙃𝘼𝙊𝙉 𝘼𝙃𝙈𝙀𝘿 🔥💻 
📥⚡𝗔𝘂𝘁𝗼 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿⚡📂
🎬 𝐄𝐧𝐣𝐨𝐲 𝐭𝐡𝐞 𝐕𝐢𝐝𝐞𝐨 🎀`,
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
