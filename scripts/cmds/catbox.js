const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "2.1.0",
  role: 0,
  credits: "Shaon x ChatGPT",
  description: "Upload media to Catbox (no .bin, no timeout)",
  category: "media",
  usePrefix: true,
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

async function uploadToCatbox(filePath, originalFilename) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fs.createReadStream(filePath), {
    filename: originalFilename,
    contentType: "application/octet-stream"
  });

  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
    timeout: 180000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const url = res.data.trim();
  if (!url.startsWith("https://")) throw new Error("Upload failed: " + url);
  return url;
}

module.exports.onStart = async ({ api, event, message }) => {
  try {
    const reply = event.messageReply || event.reply_to_message;

    if (!reply || !(
      reply.photo || reply.video || reply.audio || reply.document
    )) {
      return message.reply("❌ দয়া করে ফটো, ভিডিও, অডিও অথবা ডকুমেন্টে রিপ্লাই দিয়ে কমান্ড দিন।");
    }

    const fileId =
      reply?.photo?.[reply.photo.length - 1]?.file_id ||
      reply?.video?.file_id ||
      reply?.audio?.file_id ||
      reply?.document?.file_id;

    if (!fileId) {
      return message.reply("❌ ফাইলের আইডি পাওয়া যায়নি।");
    }

    const fileUrl = await api.getFileLink(fileId);

    if (!fileUrl) {
      return message.reply("❌ টেলিগ্রাম থেকে ফাইল লিঙ্ক আনতে সমস্যা হয়েছে।");
    }

    const type = reply.photo ? "photo" :
      reply.video ? "video" :
      reply.audio ? "audio" :
      reply.document ? "document" : "dat";

    const ext = getExtensionFromType(type);
    const filename = `file_${Date.now()}.${ext}`;
    const tmpPath = path.join(os.tmpdir(), filename);

    if (filename.endsWith(".bin")) {
      return message.reply("❌ .bin ফাইল আপলোড সমর্থিত নয়।");
    }

    await downloadFile(fileUrl, tmpPath);
    const result = await uploadToCatbox(tmpPath, filename);
    fs.unlinkSync(tmpPath);

    return message.reply(`✅ ফাইল সফলভাবে আপলোড হয়েছে:\n🔗 ${result}`);
  } catch (err) {
    console.error("Catbox error:", err);
    return message.reply(`❌ আপলোড ব্যর্থ: ${err.message || "অজানা সমস্যা"}`);
  }
};
