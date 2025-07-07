const axios = require('axios');

module.exports.config = {
  name: "add1",
  version: "12.0.0",
  role: 0,
  credits: "Shaon Ahmed",
  usePrefix: true,
  description: "Add video to specific category (anime, baby, lofi, etc)",
  category: "video",
  usages: "add [category]",
  cooldowns: 5,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  try {
    if (args.length === 0) {
      return message.reply("📌 ব্যবহার:\nadd <category>\nউদাহরণ: add anime\nতারপর রিপ্লাই করে ভিডিও দিন।");
    }

    const category = args[0].toLowerCase();

    // 🗑️ delete by name
    if (category === "delete") {
      const name = args.slice(1).join(" ").trim();
      if (!name) return message.reply("❌ ডিলিট করার জন্য নাম দিন।");
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
      const Shaon = apis.data.api;
      const delRes = await axios.get(`${Shaon}/video/random?type=delete&name=${encodeURIComponent(name)}`);
      return message.reply(`🗑️ ${delRes.data.message}`);
    }

    // 🗑️ delete by url
    if (category === "deleteurl") {
      const url = args.slice(1).join(" ").trim();
      if (!url) return message.reply("❌ ডিলিট করার জন্য URL দিন।");
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
      const Shaon = apis.data.api;
      const delUrlRes = await axios.get(`${Shaon}/video/random?type=delete&url=${encodeURIComponent(url)}`);
      return message.reply(`🗑️ ${delUrlRes.data.message}`);
    }

    // ✅ Add new media
    const fileId =
      event?.reply_to_message?.photo?.slice(-1)[0]?.file_id ||
      event?.reply_to_message?.video?.file_id;

    if (!fileId) return message.reply("❗ রিপ্লাই করে একটি ভিডিও বা ছবি দিন।");

    const fileUrl = await api.getFileLink(fileId);

    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const allApi = apis.data.allapi;
    const base = apis.data.api;

    const imgurRes = await axios.get(`${allApi}/imgur?url=${encodeURIComponent(fileUrl)}`);
    const imgurLink = imgurRes.data.link;

    const saveRes = await axios.get(`${base}/video/${category}?add=${category}&url=${encodeURIComponent(imgurLink)}`);

    message.reply(`✅ Added to '${category.toUpperCase()}'\n🔗 ${imgurLink}`);
    
  } catch (e) {
    console.log(e);
    message.reply(`❌ Error: ${e.message}`);
  }
};
