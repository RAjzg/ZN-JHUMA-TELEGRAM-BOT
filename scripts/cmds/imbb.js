const axios = require('axios');

const getApiBase = async () => {
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
    );
    return res.data.allapi;
  } catch (e) {
    console.error("❌ Failed to fetch API base URL:", e);
    throw new Error("API base URL fetch failed");
  }
};

module.exports.config = {
  name: "imgbb",
  version: "0.0.1",
  role: 0,
  author: "Shaon Ahmed",
  description: "Upload an image to Imgbb via a URL or replied image",
  category: "media",
  usage: "/imgbb <image_url> or reply to an image with /imgbb",
  cooldown: 5,
};

module.exports.run = async ({ bot, msg, args }) => {
  const chatId = msg.chat.id;
  let imageUrl;

  try {
    if (msg.reply_to_message && msg.reply_to_message.photo) {
      const photos = msg.reply_to_message.photo;
      const fileId = photos[photos.length - 1].file_id;

      const file = await bot.getFile(fileId);
      imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    } else if (args.length > 0) {
      imageUrl = args[0];
    } else {
      return bot.sendMessage(chatId, "⚠️ Please reply to an image or provide an image URL.");
    }

    const apiBase = await getApiBase();
    const res = await axios.get(`${apiBase}/imbb?link=${encodeURIComponent(imageUrl)}`);

    const uploadedUrl = res.data.url;

    if (!uploadedUrl) {
      return bot.sendMessage(chatId, "❌ Failed to upload image. Invalid response.");
    }

    return bot.sendMessage(chatId, `✅ Uploaded Successfully:\n${uploadedUrl}`);
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return bot.sendMessage(chatId, "❌ Failed to upload image. Try again later.");
  }
}
