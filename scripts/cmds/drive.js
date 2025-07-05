const axios = require('axios');

module.exports.config = {
  name: "drive",
  version: "0.0.4",
  role: 0,
  credits: "ArYAN + ChatGPT Fix",
  usePrefix: true,
  description: "Upload files to Google Drive",
  category: "utility",
  usages: "{pn} <link> or reply to media",
  cooldowns: 10,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  let inputUrl = args[0];

  try {
    // Check for reply with media
    if (!inputUrl && event.messageReply) {
      const reply = event.messageReply;

      let fileId;

      if (reply.attachments && reply.attachments.length > 0) {
        fileId = reply.attachments[0].file_id;
      } else if (reply.photo) {
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

    // If no valid input URL
    if (!inputUrl) {
      return message.reply("⚠️ Please provide a valid file URL or reply to a photo, video, or document.");
    }

    await message.reply("⏳ Uploading file to Google Drive...");

    const res = await axios.get(`https://web-api-delta.vercel.app/drive?url=${encodeURIComponent(inputUrl)}`);
    const data = res.data;

    if (data.driveLink || data.driveLIink) {
      return message.reply(`✅ Uploaded to Google Drive:\n🔗 ${data.driveLink || data.driveLIink}`);
    } else {
      return message.reply(`❌ Failed to upload:\n${data.message || data.error || "Unknown error"}`);
    }

  } catch (err) {
    console.error(err);
    return message.reply("❌ Internal error occurred while uploading. Try again later.");
  }
};
