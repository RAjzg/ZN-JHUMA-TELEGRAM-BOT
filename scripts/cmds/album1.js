const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "2.1.0",
    role: 0,
    author: "Shaon Ahmed",
    description: "Album system with Imgur, category, and command support",
    category: "media",
    countDown: 5,
  },

  onStart: async ({ event, api, bot, args }) => {
    const chatId = event.chat.id;
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;
    const Imgur = apis.data.imgur;

    const subCommand = args[0]?.toLowerCase();
    const categoryName = args.slice(1).join(" ");

    // 🅰️ Command: /album1 add islamic
    if (subCommand === "add" && categoryName) {
      await api.sendMessage(chatId, `📤 Send the media (photo/video) now for category: *${categoryName}*`, { parse_mode: "Markdown" });

      bot.once("message", async (msg) => {
        const file = msg.video || msg.photo?.[msg.photo.length - 1];
        if (!file) return api.sendMessage(chatId, "❗ Please send a valid video or photo.");

        try {
          const fileLink = await api.getFileLink(file.file_id);
          const upload = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(fileLink)}`);
          const imgurUrl = upload.data.link;

          await axios.get(`${Shaon}/album?add=${encodeURIComponent(categoryName)}&url=${encodeURIComponent(imgurUrl)}`);
          await api.sendMessage(chatId, `✅ Media added to category *${categoryName}*`, { parse_mode: "Markdown" });

        } catch (e) {
          await api.sendMessage(chatId, `❌ Upload failed: ${e.message}`);
        }
      });

      return;
    }

    // 🅱️ Command: /album1 list
    if (subCommand === "list") {
      const res = await axios.get(`${Shaon}/album?list=true`);
      return api.sendMessage(chatId, `📚 Album List:\n\n${res.data.data}`);
    }

    // 🅲 Command: /album1 create islamic
    if (subCommand === "create" && categoryName) {
      const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(categoryName)}`);
      return api.sendMessage(chatId, `✅ ${res.data.message}`);
    }

    // 🅳 Command: /album1 delete islamic
    if (subCommand === "delete" && categoryName) {
      const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(categoryName)}`);
      return api.sendMessage(chatId, `🧹 ${res.data.message}`);
    }

    // 🅴 Command: /album1 random islamic
    if (subCommand === "random" && categoryName) {
      const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(categoryName)}`);
      const videoUrl = res.data.url;
      const caption = res.data.cp || "";

      return api.sendVideo(chatId, videoUrl, {
        caption: `${caption}\n🎞️ Category: ${res.data.category}\n🎬 Total: ${res.data.count || 1}`,
        reply_markup: { inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]] }
      });
    }

    // ℹ️ Default Help Message
    return api.sendMessage(chatId, `📁 *Album Commands:*
    
• /album1 list — Show all categories
• /album1 create [name] — Create a new category
• /album1 delete [name] — Delete a category
• /album1 add [name] — Add media to a category
• /album1 random [name] — Get random media from a category

📌 Example: /album1 add islamic

Then send a photo/video file.
`, { parse_mode: "Markdown" });
  }
};
