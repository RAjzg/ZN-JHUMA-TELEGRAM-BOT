const axios = require('axios');

module.exports = {
  config: {
    name: "drive",
    version: "0.0.1",
    author: "ArYAN",
    cooldown: 5,
    role: 0,
    description: "Upload videos and other media to Google Drive easily!",
    category: "Utility",
    guide: "Use: {pn} <link> to upload a file from a direct link.\nOr reply to a photo, video, or document message to upload it."
  },

  onStart: async function ({ bot, message, msg, chatId, args }) {
    let inputUrl = args[0];

    if (!inputUrl && msg.reply_to_message) {
      const repliedMessage = msg.reply_to_message;

      if (repliedMessage.photo) {
        const fileId = repliedMessage.photo[repliedMessage.photo.length - 1].file_id;
        inputUrl = await bot.getFileLink(fileId).catch(e => console.error("Error getting photo file link:", e));
      } else if (repliedMessage.video) {
        const fileId = repliedMessage.video.file_id;
        inputUrl = await bot.getFileLink(fileId).catch(e => console.error("Error getting video file link:", e));
      } else if (repliedMessage.document) {
        const fileId = repliedMessage.document.file_id;
        inputUrl = await bot.getFileLink(fileId).catch(e => console.error("Error getting document file link:", e));
      }
    }

    if (!inputUrl) {
      return message.reply("Please provide a valid file URL or reply to a message containing a photo, video, or document to upload.");
    }

    const loadingMessage = await message.reply("⏳ Uploading your file to Google Drive...");

    try {
      const noobx = "ArYAN";
      const apiURL = `https://aryan-xyz-google-drive.vercel.app/drive?url=${encodeURIComponent(inputUrl)}&apikey=${noobx}`;
      const res = await axios.get(apiURL);
      const data = res.data || {};

      const driveLink = data.driveLink || data.driveLIink;

      if (driveLink) {
        const successMsg = `✅ File uploaded to Google Drive!\n\n🔗 URL: ${driveLink}`;
        await bot.deleteMessage(chatId, loadingMessage.message_id).catch(console.error);
        return message.reply(successMsg);
      } else {
        const errorDetail = data.error || data.message || JSON.stringify(data);
        const errorMsg = `❌ Upload failed: ${errorDetail}`;
        await bot.deleteMessage(chatId, loadingMessage.message_id).catch(console.error);
        return message.reply(errorMsg);
      }
    } catch (error) {
      console.error("Google Drive Upload Error:", error);
      await bot.deleteMessage(chatId, loadingMessage.message_id).catch(console.error);
      return message.reply("An error occurred during upload. Please try again later. Check logs for details.");
    }
  }
};
