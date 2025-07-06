const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "3.0.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Album system with category and Imgur support",
    category: "media",
    countDown: 5
  },

  onStart: async ({ bot, api, event, args }) => {
    const input = args.join(" ");
    const chatId = event.chat.id;
    const fromId = event.from.id;

    const { data: apis } = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.api;
    const Imgur = apis.imgur;

    // Show list
    if (input === "" || input === "list") {
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let msg = "╭─『 🎬 VIDEO ALBUM 』─╮\n";
      lines.forEach((line, i) => {
        const match = line.match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          const num = match[1].padStart(2, "0");
          const category = match[2];
          categories.push(category);
          msg += `│ ${num}. ${category} Video\n`;
        }
      });
      msg += "╰────────────────────╯\n\n✨ Reply with number to get a video";

      const sent = await api.sendMessage(chatId, msg);
      module.exports.reply = {
        messageId: sent.message_id,
        fromId,
        categories
      };
      return;
    }

    // Add media: /album add <category>
    if (input.startsWith("add ")) {
      const category = input.slice(4).trim();
      const sent = await api.sendMessage(chatId, `📥 Reply to this with a video/photo to add in "${category}"`);
      module.exports.reply = {
        messageId: sent.message_id,
        fromId,
        action: "add",
        category,
        Shaon,
        Imgur
      };
      return;
    }

    // Create category
    if (input.startsWith("create ")) {
      const category = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(category)}`);
      return api.sendMessage(chatId, res.data.message);
    }

    // Delete category
    if (input.startsWith("delete ")) {
      const category = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(category)}`);
      return api.sendMessage(chatId, res.data.message);
    }

    // Get by name
    const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(input)}`);
    const videoUrl = res.data.url;
    const caption = res.data.cp || "";

    return api.sendVideo(chatId, videoUrl, {
      caption: `${caption}\n🎞️ ক্যাটাগরি: ${res.data.category}\n📦 মোট ভিডিও: ${res.data.count || "1"}`
    });
  },

  reply: async ({ bot, api, event }) => {
    const { messageId, fromId, categories, action, category, Shaon, Imgur } = module.exports.reply || {};
    if (!messageId || event.from.id !== fromId) return;

    const chatId = event.chat.id;

    // If it's reply to category list → fetch video
    if (categories) {
      const number = parseInt(event.text);
      if (isNaN(number) || number < 1 || number > categories.length)
        return api.sendMessage(chatId, "⚠️ Invalid number. Please reply with a valid number.");

      const selected = categories[number - 1];
      const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(selected)}`);
      const videoUrl = res.data.url;
      const caption = res.data.cp || "";

      return api.sendVideo(chatId, videoUrl, {
        caption: `${caption}\n🎞️ ক্যাটাগরি: ${selected}\n📦 মোট ভিডিও: ${res.data.count || "1"}`
      });
    }

    // If it's reply to add request
    if (action === "add") {
      const file = event.video || (event.photo && event.photo[event.photo.length - 1]);
      if (!file) return api.sendMessage(chatId, "❗ No media detected.");

      const link = await api.getFileLink(file.file_id);
      const upload = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(link)}`);
      const imgurLink = upload.data.link;

      await axios.get(`${Shaon}/album?add=${encodeURIComponent(category)}&url=${encodeURIComponent(imgurLink)}`);
      return api.sendMessage(chatId, `✅ Added to category "${category}"`);
    }
  }
};
