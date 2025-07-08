const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "1.3.2",
  role: 0,
  credits: "Shaon Ahmed Fix by ChatGPT",
  usePrefix: true,
  description: "Upload replied media to Catbox",
  category: "media",
  usages: "[reply to photo/video/audio/document]",
  cooldowns: 10,
};

// 🧠 Extension by content-type
function getExtension(contentType) {
  const types = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/x-matroska": "mkv",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/x-rar-compressed": "rar",
  };
  return types[contentType] || null; // ❌ no fallback like "bin"
}

// ⬇️ Download file
async function downloadFile(url, destPath) {
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: { "User-Agent": "TelegramBot" },
  });
  const writer = fs.createWriteStream(destPath);
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// ⬆️ Upload to Catbox
async function uploadFileToCatbox(filePath) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fs.createReadStream(filePath), path.basename(filePath));

  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60000, // ⏱️ Optional extended timeout
  });

  const url = res.data.trim();
  if (!url.startsWith("https://")) throw new Error("Catbox response error: " + url);
  return url;
}

// 🧠 Main logic
module.exports.onStart = async ({ api, event, message }) => {
  try {
    const replied = event.reply_to_message;
    if (!replied) return message.reply("❐ Please reply to a media file.");

    const fileId =
      replied?.photo?.[replied.photo.length - 1]?.file_id ||
      replied?.video?.file_id ||
      replied?.audio?.file_id ||
      replied?.document?.file_id;

    if (!fileId) return message.reply("❐ No supported file found.");

    const fileUrl = await api.getFileLink(fileId);
    let ext;

    // ✅ Try content-type
    try {
      const head = await axios.head(fileUrl);
      const type = head.headers["content-type"];
      ext = getExtension(type);
      if (!ext) throw new Error("Unsupported content-type: " + type);
    } catch (e) {
      return message.reply("❌ Could not determine file type. Upload aborted.");
    }

    const tempPath = path.join(os.tmpdir(), `catbox_${Date.now()}.${ext}`);
    await downloadFile(fileUrl, tempPath);

    const uploadedUrl = await uploadFileToCatbox(tempPath);
    fs.unlinkSync(tempPath);

    return message.reply(`✅ Uploaded successfully:\n${uploadedUrl}`);
  } catch (e) {
    console.error("Upload Error:", e);
    return message.reply(`❌ Upload failed: ${e.message}`);
  }
};
