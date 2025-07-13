const axios = require('axios');

module.exports.config = {
  name: "add",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat", // Nazrul
  usePrefix: true,
  description: "random love story video",
  category: "video",
  usages: "random",
  cooldowns: 30,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  try {
    if (args.length === 0) {
      return message.reply("📌 ব্যবহার: add [video name] বা add delete [name] বা add deleteurl [url]");
    }

    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const Shaon = apis.data.api;

    // 🗑️ Handle delete by name
    if (args[0].toLowerCase() === "delete") {
      const videoName = args.slice(1).join(" ").trim();
      if (!videoName) return message.reply("❌ দয়া করে ডিলিট করার জন্য একটি নাম দিন।");

      const delRes = await axios.get(`${Shaon}/video/random?type=delete&name=${encodeURIComponent(videoName)}`);
      return message.reply(`🗑️ ${delRes.data.message}`);
    }

    // 🗑️ Handle delete by URL
    if (args[0].toLowerCase() === "deleteurl") {
      const videoUrl = args.slice(1).join(" ").trim();
      if (!videoUrl) return message.reply("❌ দয়া করে ডিলিট করার জন্য একটি URL দিন।");

      const delUrlRes = await axios.get(`${Shaon}/video/random?type=delete&url=${encodeURIComponent(videoUrl)}`);
      return message.reply(`🗑️ ${delUrlRes.data.message}`);
    }

    // ➕ Add new video
    const fileId =
      event?.reply_to_message?.photo?.slice(-1)[0]?.file_id ||
      event?.reply_to_message?.video?.file_id;

    if (!fileId) return message.reply("❌ দয়া করে একটি ভিডিও বা ছবি রিপ্লাই করুন।");

    const imageUrl = await api.getFileLink(fileId);
    const videoName = args.join(" ").trim();

    if (!videoName) {
      return message.reply("❌ দয়া করে ভিডিওর নাম লিখুন।");
    }

    const apis1 = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const Shaon1 = apis1.data.allapi;

    const imgurResponse = await axios.get(`${Shaon1}/catbox?url=${encodeURIComponent(imageUrl)}`);
    const imgurLink = imgurResponse.data.url;

    const response = await axios.get(`${Shaon}/video/random?name=${encodeURIComponent(videoName)}&url=${encodeURIComponent(imgurLink)}`);
    
    message.reply(`✅ URL ADDED SUCCESSFULLY\n📁 Name: ${response.data.name}\n🔗 URL: ${response.data.url}`);

  } catch (e) {
    console.log(e);
    message.reply(`❌ An error occurred: ${e.message}`);
  }
};
