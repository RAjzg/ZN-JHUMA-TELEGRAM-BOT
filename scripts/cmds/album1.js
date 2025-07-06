const axios = require("axios");

let waitingMedia = {}; // userId -> category

module.exports = {
  config: {
    name: "album1",
    version: "3.0.0",
    author: "Shaon Ahmed",
    description: "Telegram album bot with add, delete, list, view",
    category: "media",
    role: 0
  },

  onStart: async ({ event, api, bot }) => {
    const { text, chat, from } = event;
    const chatId = chat.id;
    const userId = from.id;

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;
    const Imgur = apis.data.imgur;

    // Check if media is pending for /album1 add
    if (waitingMedia[userId]) {
      const category = waitingMedia[userId];

      const file = event.video || (event.photo && event.photo[event.photo.length - 1]);
      if (!file) return api.sendMessage(chatId, "❗ No media detected.", { reply_to_message_id: event.message_id });

      const link = await api.getFileLink(file.file_id);
      const imgurUpload = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(link)}`);
      const imgurLink = imgurUpload.data.link;

      await axios.get(`${Shaon}/album?add=${encodeURIComponent(category)}&url=${encodeURIComponent(imgurLink)}`);
      delete waitingMedia[userId];
      return api.sendMessage(chatId, `✅ Media added to category: ${category}`, { reply_to_message_id: event.message_id });
    }

    const args = text.split(" ").slice(1);
    const input = args.join(" ").trim();

    if (text.startsWith("/album1")) {
      // ➕ Add
      if (args[0] === "add") {
        const category = args.slice(1).join(" ").trim();
        if (!category) return api.sendMessage(chatId, "⚠️ Provide category name to add media.", { reply_to_message_id: event.message_id });

        waitingMedia[userId] = category;
        return api.sendMessage(chatId, `📩 Send media now to add to *${category}*`, { reply_to_message_id: event.message_id });

      // 🆕 Create
      } else if (args[0] === "create") {
        const name = args.slice(1).join(" ");
        const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(name)}`);
        return api.sendMessage(chatId, `✅ ${res.data.message}`, { reply_to_message_id: event.message_id });

      // 🗑️ Delete
      } else if (args[0] === "delete") {
        const name = args.slice(1).join(" ");
        const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(name)}`);
        return api.sendMessage(chatId, `🧹 ${res.data.message}`, { reply_to_message_id: event.message_id });

      // 📥 View by Category
      } else if (args.length > 0) {
        const name = args.join(" ");
        const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(name)}`);
        const videoUrl = res.data.url;
        const caption = `🎞️ Category: ${res.data.category}\n📦 Total: ${res.data.count || 1}`;
        return api.sendVideo(chatId, videoUrl, {
          caption,
          reply_markup: { inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]] },
          reply_to_message_id: event.message_id
        });
      }

      // 📃 List
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let textMsg = "🎬 *Album Categories:*\n";
      lines.forEach((line, i) => {
        const match = line.match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          categories.push(match[2]);
          textMsg += `${i + 1}. ${match[2]} Video\n`;
        }
      });
      textMsg += "\n📝 Reply this message with number (e.g., 1)";

      const sent = await api.sendMessage(chatId, textMsg, { parse_mode: "Markdown" });
      bot.once("message", async (msg) => {
        const index = parseInt(msg.text);
        if (isNaN(index) || index < 1 || index > categories.length) {
          return api.sendMessage(chatId, "❗ Invalid number.", { reply_to_message_id: msg.message_id });
        }
        const name = categories[index - 1];
        const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(name)}`);
        const videoUrl = res.data.url;
        const caption = `🎞️ Category: ${res.data.category}\n📦 Total: ${res.data.count || 1}`;
        return api.sendVideo(chatId, videoUrl, {
          caption,
          reply_to_message_id: msg.message_id
        });
      });
    }
  }
};
