const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "1.1.0",
  role: 0,
  credits: "Shaon Ahmed Fix by ChatGPT",
  usePrefix: true,
  description: "Upload replied media to Catbox",
  category: "media",
  usages: "[reply to photo/video/audio/document]",
  cooldowns: 10
};

// Extension detect function
function getExtension(contentType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'application/zip': 'zip',
    'application/pdf': 'pdf',
    'application/octet-stream': 'bin'
  };
  return map[contentType] || 'dat';
}

// Download file
async function downloadFile(url, destPath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Upload to Catbox
async function uploadFileToCatbox(filePath) {
  const CATBOX_USER_HASH = '8e68fd8d6375763e3ec135499'; // ✅ Userhash বসাও

  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("userhash", CATBOX_USER_HASH);
  form.append("fileToUpload", fs.createReadStream(filePath));

  const response = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const url = response.data.trim();
  if (!url.startsWith("https://")) {
    throw new Error("Upload failed: " + url);
  }
  return url;
}

// Main Command
module.exports.onStart = async ({ api, event, message }) => {
  try {
    if (!event) return message.reply("❌ Event data missing.");

    const replied = event.reply_to_message;
    if (!replied) {
      return message.reply("❐ Please reply to a photo/video/audio/document.");
    }

    const fileId =
      replied?.photo?.[replied.photo.length - 1]?.file_id ||
      replied?.video?.file_id ||
      replied?.audio?.file_id ||
      replied?.document?.file_id;

    if (!fileId) {
      return message.reply("❐ Replied message does not contain supported media.");
    }

    const fileUrl = await api.getFileLink(fileId);

    // Get content-type to determine extension
    let ext = 'dat';
    try {
      const head = await axios.head(fileUrl);
      const contentType = head.headers['content-type'];
      ext = getExtension(contentType);
    } catch (e) {
      const guessed = path.extname(new URL(fileUrl).pathname).replace('.', '');
      if (guessed) ext = guessed;
    }

    const tempFilePath = path.join(os.tmpdir(), `catbox_${Date.now()}.${ext}`);

    await downloadFile(fileUrl, tempFilePath);

    const uploadedUrl = await uploadFileToCatbox(tempFilePath);

    fs.unlinkSync(tempFilePath);

    return message.reply(`✅ Uploaded successfully:\n${uploadedUrl}`);

  } catch (error) {
    console.error("Catbox Upload Error:", error);
    return message.reply(`❌ Upload failed: ${error.message || error}`);
  }
};
