const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "1.0.2",
  role: 0,
  credits: "Mirai Style by Shaon + ChatGPT",
  usePrefix: true,
  description: "Upload media to Catbox like Mirai",
  category: "media",
  usages: "[reply to image/video/audio]",
  cooldowns: 5,
};

function getExtFromMime(type) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/x-matroska": "mkv",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "application/pdf": "pdf",
  };
  return map[type] || null;
}

async function downloadFile(url, dest) {
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: { "User-Agent": "TelegramBot" },
  });
  const stream = fs.createWriteStream(dest);
  res.data.pipe(stream);
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function uploadToCatbox(filePath) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fs.createReadStream(filePath), path.basename(filePath));

  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const url = res.data.trim();
  if (!url.startsWith("https://")) throw new Error("Upload failed: " + url);
  return url;
}

module.exports.onStart = async ({ api, event, message }) => {
  try {
    const reply = event.reply_to_message;
    if (!reply || !(
      reply.photo || reply.video || reply.audio || reply.document
    )) {
      return message.reply("❌ Please reply to a valid photo/video/audio/document.");
    }

    const fileId =
      reply?.photo?.[reply.photo.length - 1]?.file_id ||
      reply?.video?.file_id ||
      reply?.audio?.file_id ||
      reply?.document?.file_id;

    const fileUrl = await api.getFileLink(fileId);

    // Guess extension
    let ext;
    try {
      const head = await axios.head(fileUrl);
      const mime = head.headers["content-type"];
      ext = getExtFromMime(mime);
      if (!ext) throw new Error("Unknown mime: " + mime);
    } catch (e) {
      return message.reply("❌ Failed to detect file type. Upload aborted.");
    }

    const tmpFile = path.join(os.tmpdir(), `catbox_${Date.now()}.${ext}`);
    await downloadFile(fileUrl, tmpFile);

    const resultUrl = await uploadToCatbox(tmpFile);
    fs.unlinkSync(tmpFile);

    return message.reply(`✅ Uploaded successfully:\n${resultUrl}`);
  } catch (err) {
    console.error("Catbox error:", err);
    return message.reply(`❌ Upload failed: ${err.message}`);
  }
};
