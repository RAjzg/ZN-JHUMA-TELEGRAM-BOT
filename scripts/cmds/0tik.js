const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json`
  );
  return base.data.api2;
};

module.exports.config = {
  name: "tik",
  version: "1.0.2",
  author: "Dipto",
  countDown: 0,
  role: 0,
  description: {
    en: "Download video and images from TikTok",
  },
  category: "𝗠𝗘𝗗𝗜𝗔",
  commandCategory: "𝗠𝗘𝗗𝗜𝗔",
  guide: {
    en: "[video_or_image_link]",
  },
};

module.exports.run = async ({ bot, msg }) => {
  this.onChat({ bot, msg });
};

module.exports.onChat = async ({ bot, msg }) => {
  const messageText = msg.link_preview_options?.url || msg.text || "";
  
  try {
    if (
      messageText.startsWith("https://vt.tiktok.com") ||
      messageText.startsWith("https://www.tiktok.com/") ||
      messageText.startsWith("https://vm.tiktok.com")
    ) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;

      const wait = await bot.sendMessage(chatId, "⏳ Processing your request...", {
        reply_to_message_id: messageId,
      });

      const waitMId = wait.message_id;
      const imagePath = path.join(__dirname, "caches", "tik_video.jpg");

      const { data } = await axios.get(
        `${await baseApiUrl()}/Shaon/tikdl?url=${encodeURIComponent(messageText)}`
      );

      if (data.images && data.images.length > 0) {
        const imageBuffer = (
          await axios.get(data.images, { responseType: "arraybuffer" })
        ).data;

        fs.writeFileSync(imagePath, Buffer.from(imageBuffer, "utf-8"));

        await bot.deleteMessage(chatId, waitMId);

        await bot.sendimage(
          chatId,
          imagePath,
          {
            caption: `🔰 Downloaded TikTok image ✅`,
            reply_to_message_id: messageId,
          },
          {
            filename: "video.jpg",
            contentType: "video/jpg",
          }
          
          );

        fs.unlinkSync(imagePath);
      }

        }
      }
    
   catch (error) {
    await bot.sendMessage(msg.chat.id, `❎ Error: ${error.message}`);
  }
};
