const axios = require('axios');

module.exports.config = {
  name: "drive",
  version: "0.0.2",
  role: 0,
  credits: "Shaon Ahmed",
  usePrefix: true,
  description: "Upload files to Google Drive",
  category: "utility",
  usages: "{pn} <link> or reply to a media",
  cooldowns: 10,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  let inputUrl = args[0];

  try {
    if (!inputUrl && event.messageReply) {
      const reply = event.messageReply;

      let fileId = null;
      if (reply.attachments && reply.attachments.length > 0) {
        fileId = reply.attachments[0].file_id;
      }

      if (fileId) {
        inputUrl = await api.getFileLink(fileId);
      }
    }

    if (!inputUrl) {
      return message.reply("⚠️ Please provide a valid URL or reply to a photo, video, or document.");
    }

    const loadingMessage = await message.reply("⏳ Uploading your file to Google Drive...");

    const apiURL = `https://web-api-delta.vercel.app/drive?url=${encodeURIComponent(inputUrl)}`;
    const res = await axios.get(apiURL);
    const data = res.data || {};

    const driveLink = data.driveLink || data.driveLIink;

    if (driveLink) {
      return message.reply(`✅ File uploaded successfully!\n\n🔗 Google Drive URL:\n${driveLink}`);
    } else {
      const errorDetail = data.error || data.message || JSON.stringify(data);
      return message.reply(`❌ Upload failed:\n${errorDetail}`);
    }

  } catch (e) {
    console.error("Google Drive Upload Error:", e);
    return message.reply("🚫 An error occurred during upload. Please try again later.");
  }
};
