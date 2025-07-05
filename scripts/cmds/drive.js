const axios = require('axios');

module.exports.config = {
  name: "drive",
  version: "0.0.3",
  role: 0,
  credits: "Shaon Ahmed + Modified by ChatGPT",
  usePrefix: true,
  description: "Upload files to Google Drive",
  category: "utility",
  usages: "{pn} <url> or reply to media",
  cooldowns: 10,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  let inputUrl = args[0];

  try {
    if (!inputUrl && event.messageReply) {
      const reply = event.messageReply;

      let fileId = null;

      // Telegram attachment check
      if (reply.photo) {
        fileId = reply.photo[reply.photo.length - 1]?.file_id;
      } else if (reply.video) {
        fileId = reply.video.file_id;
      } else if (reply.document) {
        fileId = reply.document.file_id;
      }

      if (fileId) {
        inputUrl = await api.getFileLink(fileId);
      }
    }

    if (!inputUrl) {
      return message.reply("⚠️ Please provide a valid file URL or reply to a photo, video, or document.");
    }

    const waitMsg = await message.reply("⏳ Uploading your file to Google Drive...");

    const res = await axios.get(`https://web-api-delta.vercel.app/drive?url=${encodeURIComponent(inputUrl)}`);
    const data = res.data || {};

    if (data.driveLink || data.driveLIink) {
      const link = data.driveLink || data.driveLIink;
      return message.reply(`✅ Uploaded successfully!\n🔗 Google Drive Link:\n${link}`);
    } else {
      const error = data.error || data.message || "Unknown error";
      return message.reply(`❌ Upload failed:\n${error}`);
    }

  } catch (e) {
    console.error("Upload error:", e);
    return message.reply("🚫 An error occurred during upload. Please try again later.");
  }
};
