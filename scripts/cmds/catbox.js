const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "1.0.3",
  role: 0,
  credits: "Shaon + ChatGPT",
  usePrefix: true,
  description: "Upload media to Catbox like Mirai",
  category: "media",
  usages: "[reply to image/video/audio]",
  cooldowns: 5,
};

function getExtensionFromType(type) {
  const extMap = {
    photo: "jpg",
    video: "mp4",
    audio: "mp3",
    document: "pdf",
    animated_image: "gif",
  };
  return extMap[type] || "dat";
}

async function downloadFile(url, destPath) {
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: { "User-Agent": "TelegramBot" },
  });
  const stream = fs.createWriteStream(destPath);
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

    // fallback extension from Telegram type
    let fallbackExt = getExtensionFromType(
      reply.photo ? "photo" :
      reply.video ? "video" :
      reply.audio ? "audio" :
      reply.document ? "document" : "dat"
    );

    let ext = fallbackExt;
    try {
      const head = await axios.head(fileUrl);
      const mime = head.headers["content-type"];
      if (mime.includes("jpeg")) ext = "jpg";
      else if (mime.includes("png")) ext = "png";
      else if (mime.includes("gif")) ext = "gif";
      else if (mime.includes("mp4")) ext = "mp4";
      else if (mime.includes("mp3")) ext = "mp3";
      else if (mime.includes("ogg")) ext = "ogg";
      else if (mime.includes("wav")) ext = "wav";
      else if (mime.includes("pdf")) ext = "pdf";
    } catch {
      // use fallbackExt silently
    }

    const tmpPath = path.join(os.tmpdir(), `catbox_${Date.now()}.${ext}`);
    await downloadFile(fileUrl, tmpPath);

    const result = await uploadToCatbox(tmpPath);
    fs.unlinkSync(tmpPath);

    return message.reply(`✅ Uploaded successfully:\n${result}`);
  } catch (err) {
    console.error("Catbox error:", err);
    return message.reply(`❌ Upload failed: ${err.message}`);
  }
};
