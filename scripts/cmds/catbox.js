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
    if (!event.messageReply) {
      return api.sendMessage("❗ দয়া করে ফাইল সহ মেসেজে রিপ্লাই দিয়ে /catbox চালান।", event.threadID, event.messageID);
    }

    const reply = event.messageReply;

    const file = (reply.attachments && reply.attachments.find(att =>
      ["photo", "video", "animated_image", "file"].includes(att.type))) || null;

    if (!file) {
      return api.sendMessage("❗ রিপ্লাই করা মেসেজে ফাইল পাওয়া যায়নি।", event.threadID, event.messageID);
    }

    if (file.name && file.name.endsWith(".bin")) {
      return api.sendMessage("❌ .bin ফাইল আপলোড সমর্থিত নয়।", event.threadID, event.messageID);
    }

    const fileUrl = file.url;
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}`);

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

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(tempFilePath));

    const catboxRes = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 15000,
    });

    fs.unlinkSync(tempFilePath);

    const catboxLink = catboxRes.data?.trim();
    console.log("Catbox response:", catboxLink); // Debug log

    if (catboxLink && catboxLink.startsWith("https://")) {
      return api.sendMessage(`✅ ফাইল আপলোড সম্পন্ন!\n🔗 লিঙ্ক: ${catboxLink}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage("❌ আপলোডের সময় সমস্যা হয়েছে। সার্ভার থেকে সঠিক লিঙ্ক পাওয়া যায়নি।", event.threadID, event.messageID);
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};
