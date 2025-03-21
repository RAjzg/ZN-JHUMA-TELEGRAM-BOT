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
      const videoPath = path.join(__dirname, "caches", "tik_video.mp4");

      const { data } = await axios.get(
        `${await baseApiUrl()}/alldl?url=${encodeURIComponent(messageText)}`
      );

      if (data.videos && data.videos.length > 0) {
        const videoBuffer = (
          await axios.get(data.videos[0].url, { responseType: "arraybuffer" })
        ).data;

        fs.writeFileSync(videoPath, Buffer.from(videoBuffer, "utf-8"));

        await bot.deleteMessage(chatId, waitMId);

        await bot.sendVideo(
          chatId,
          videoPath,
          {
            caption: `🔰 Downloaded TikTok Video ✅`,
            reply_to_message_id: messageId,
          },
          {
            filename: "video.mp4",
            contentType: "video/mp4",
          }
        );

        fs.unlinkSync(videoPath);
      }

      if (data.full_data?.data?.images?.length > 0) {
        for (const img of data.full_data.data.images) {
          const imageUrl = img.url; 
          const imagePath = path.join(__dirname, "caches", `tik_image_${Date.now()}.jpg`);

          const imageBuffer = (
            await axios.get(imageUrl, { responseType: "arraybuffer" })
          ).data;

          fs.writeFileSync(imagePath, Buffer.from(imageBuffer, "utf-8"));

          await bot.sendPhoto(chatId, imagePath, {
            caption: "📷 Downloaded Image ✅",
            reply_to_message_id: messageId,
          });

          fs.unlinkSync(imagePath);
        }
      }
    }
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❎ Error: ${error.message}`);
  }
};
