const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "1.0.0",
  role: 0,
  credits: "Shaon Ahmed",
  usePrefix: true,
  description: "Upload replied media to Catbox",
  category: "media",
  usages: "[reply to photo/video/audio]",
  cooldowns: 10
};

async function downloadFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function uploadFileToCatbox(filePath) {
  const CATBOX_USER_HASH = '8e68fd8d6375763e3ec135499'; // তোমার userhash বসাও
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

module.exports.onStart = async ({ api, event, message }) => {
  try {
    if (!event) return message.reply("❌ Event data missing.");
    if (!message) return; // message object না থাকলে কিছু করা যাবে না

    // নিশ্চিত হও যে reply_to_message আছে
    const repliedMsg = event.reply_to_message;
    if (!repliedMsg) {
      return message.reply("❐ Please reply to a photo/video/audio file.");
    }

    // ফটো, ভিডিও বা অডিও থেকে file_id পাওয়ার চেষ্টা করো
    const fileId =
      repliedMsg.photo ? repliedMsg.photo[repliedMsg.photo.length - 1].file_id :
      repliedMsg.video ? repliedMsg.video.file_id :
      repliedMsg.audio ? repliedMsg.audio.file_id :
      null;

    if (!fileId) {
      return message.reply("❐ Replied message does not contain photo/video/audio.");
    }

    // Telegram থেকে ফাইল URL নাও
    const fileUrl = await api.getFileLink(fileId);

    // ফাইলের এক্সটেনশন নির্ণয়
    let ext = path.extname(fileUrl).split("?")[0];
    if (!ext) ext = ".jpg";

    // টেম্প ফাইল পাথ তৈরি
    const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}${ext}`);

    // ফাইল ডাউনলোড করো
    await downloadFile(fileUrl, tempFilePath);

    // Catbox এ আপলোড করো
    const uploadedUrl = await uploadFileToCatbox(tempFilePath);

    // লোকাল টেম্প ফাইল মুছে ফেলো
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // ইউজারকে সফলতার মেসেজ পাঠাও
    return message.reply(`✅ Uploaded successfully:\n${uploadedUrl}`);

  } catch (error) {
    console.error("Catbox Upload Error:", error);
    return message.reply(`❌ Upload failed: ${error.message || error}`);
  }
};
