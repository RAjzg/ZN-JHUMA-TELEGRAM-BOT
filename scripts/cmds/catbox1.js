const axios = require('axios');

module.exports.config = {
  name: "catbox",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat (Modified by Shaon Ahmed)",
  usePrefix: true,
  description: "Upload media to Catbox (supports image, video, gif, audio, etc.)",
  category: "media",
  usages: "Reply to a media file and use: catbox",
  cooldowns: 10,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  try {
    // ✅ Try to extract file_id from various media types
    const fileId =
      event?.reply_to_message?.photo?.slice(-1)[0]?.file_id ||  // 📷 Photo
      event?.reply_to_message?.video?.file_id ||               // 🎥 Video
      event?.reply_to_message?.animation?.file_id ||           // 🌀 GIF (animation)
      event?.reply_to_message?.audio?.file_id ||               // 🔊 Audio
      event?.reply_to_message?.voice?.file_id ||               // 🎤 Voice message
      event?.reply_to_message?.document?.file_id;              // 📄 Document (fallback)

    if (!fileId) {
      return message.reply("❗Please reply to a valid media file (photo, video, audio, gif, or document).");
    }

    // ✅ Get Telegram file link
    const fileUrl = await api.getFileLink(fileId);

    // ✅ Get dynamic API base from GitHub
    const apiList = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const ShaonAPI = apiList.data.noobs;

    // ✅ Upload to catboxr
    const upload = await axios.get(`${ShaonAPI}/catbox?url=${encodeURIComponent(fileUrl)}`);

    // ✅ Send result
    message.reply(`✅ Uploaded to Catbox:\n${upload.data.url}`);

  } catch (error) {
    console.error(error);
    message.reply(`❌ Error occurred: ${error.message}`);
  }
};
