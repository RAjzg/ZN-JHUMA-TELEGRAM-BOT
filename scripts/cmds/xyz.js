const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "xyz",
  version: "1.0",
  aliases: [],
  role: 0,
  description: "Upload replied media (image, video, or audio) and get a direct download link.",
  author: "Shaon Modified",
  category: "media",
  cooldown: 5,
  guide: "{pn} (reply to an image/video/audio)"
};

module.exports.run = async ({ bot, message }) => {
  const { reply_to_message } = message;

  if (!reply_to_message) {
    return message.reply("❌ Please reply to an image, video, or audio file.");
  }

  let file_id, ext;
  if (reply_to_message.photo) {
    const sizes = reply_to_message.photo;
    file_id = sizes[sizes.length - 1].file_id;
    ext = ".jpg";
  } else if (reply_to_message.video) {
    file_id = reply_to_message.video.file_id;
    ext = ".mp4";
  } else if (reply_to_message.audio) {
    file_id = reply_to_message.audio.file_id;
    ext = ".mp3";
  } else {
    return message.reply("❌ Unsupported media type. Only photo, video, and audio are allowed.");
  }

  try {
    const file = await bot.telegram.getFile(file_id);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const tempPath = path.join(__dirname, "..", "caches", `media_${Date.now()}${ext}`);

    const writer = fs.createWriteStream(tempPath);
    const res = await axios.get(fileUrl, { responseType: "stream" });
    res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const form = new FormData();
    form.append("file", fs.createReadStream(tempPath));

    const uploadRes = await axios.post("https://shaon-xyz.onrender.com/upload", form, {
      headers: form.getHeaders()
    });

    fs.unlinkSync(tempPath);

    if (uploadRes.data?.url || uploadRes.data?.link) {
      return message.reply(`✅ Uploaded Successfully:\n🔗 ${uploadRes.data.url || uploadRes.data.link}`);
    } else {
      return message.reply("⚠️ Upload failed. No link returned.");
    }

  } catch (err) {
    console.error("Upload error:", err.message);
    return message.reply("❌ Upload failed. File may be too large or server is down.");
  }
};
