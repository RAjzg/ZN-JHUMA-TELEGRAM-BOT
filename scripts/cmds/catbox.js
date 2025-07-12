const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "2.0.0",
  role: 0,
  credits: "Shaon x ChatGPT",
  description: "Upload media to Catbox (no .bin, no timeout)",
  category: "media",
  usePrefix: true,
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    // রিপ্লাই চেক
    if (!event.messageReply) {
      return api.sendMessage("❗ দয়া করে ফাইল সহ মেসেজে রিপ্লাই দিয়ে /catbox চালান।", event.threadID, event.messageID);
    }

    const reply = event.messageReply;

    // ফাইল ধরার চেষ্টা (photo, video, gif, document)
    const file =
      (reply.attachments && reply.attachments.find(att => ["photo", "video", "animated_image", "file"].includes(att.type))) || null;

    if (!file) {
      return api.sendMessage("❗ রিপ্লাই করা মেসেজে ফাইল পাওয়া যায়নি।", event.threadID, event.messageID);
    }

    // .bin ফাইল নিষিদ্ধ
    if (file.name && file.name.endsWith(".bin")) {
      return api.sendMessage("❌ .bin ফাইল আপলোড সমর্থিত নয়।", event.threadID, event.messageID);
    }

    // ফাইল url পাওয়া (Messenger API থাকে reply.attachments[].url)
    const fileUrl = file.url;

    // লোকালি ডাউনলোড পাথ
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}`);

    // ফাইল ডাউনলোড
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Catbox API তে আপলোডের জন্য form-data তৈরি
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(tempFilePath));

    // আপলোড
    const catboxRes = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 15000, // 15 সেকেন্ড টাইমআউট (তুমি চাইলে বাড়াতে পারো)
    });

    // টেম্প ফাইল মুছে ফেলা
    fs.unlinkSync(tempFilePath);

    const catboxLink = catboxRes.data;

    if (catboxLink.startsWith("https://")) {
      return api.sendMessage(`✅ ফাইল আপলোড সম্পন্ন!\n🔗 লিঙ্ক: ${catboxLink}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage("❌ আপলোডের সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};
