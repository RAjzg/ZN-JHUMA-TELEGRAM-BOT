const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "xyz",
  version: "1.0",
  role: 0,
  credits: "Shaon Ahmed",
  usePrefix: true,
  description: "Upload replied media (image, video, audio) to custom upload server",
  category: "media",
  usages: "{pn} (reply to media)",
  cooldowns: 10,
};

module.exports.onStart = async ({ api, event, message }) => {
  try {
    const reply = event.reply_to_message;
    if (!reply) {
      return await message.reply("❌ Please reply to an image, video, or audio file.");
    }

    let fileId, ext;
    if (reply.photo && Array.isArray(reply.photo) && reply.photo.length > 0) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
      ext = ".jpg";
    } else if (reply.video && reply.video.file_id) {
      fileId = reply.video.file_id;
      ext = ".mp4";
    } else if (reply.audio && reply.audio.file_id) {
      fileId = reply.audio.file_id;
      ext = ".mp3";
    } else {
      return await message.reply("❌ Unsupported media type. Only photo, video, and audio are supported.");
    }

    // Get direct Telegram file URL
    const file = await api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;

    // Download file to temp cache folder
    const tempDir = path.join(__dirname, "..", "caches");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const tempFilePath = path.join(tempDir, `media_${Date.now()}${ext}`);
    const writer = fs.createWriteStream(tempFilePath);

    const response = await axios.get(fileUrl, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Upload to custom server
    const form = new FormData();
    form.append("file", fs.createReadStream(tempFilePath));

    const uploadRes = await axios.post("https://shaon-xyz.onrender.com/upload", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Delete temp file
    fs.unlinkSync(tempFilePath);

    if (uploadRes.data?.url || uploadRes.data?.link) {
      await message.reply(`✅ Uploaded Successfully:\n🔗 ${uploadRes.data.url || uploadRes.data.link}`);
    } else {
      await message.reply("⚠️ Upload failed. No link returned from server.");
    }
  } catch (error) {
    console.error("Upload error:", error);
    await message.reply("❌ Upload failed. File may be too large or server is down.");
  }
};
