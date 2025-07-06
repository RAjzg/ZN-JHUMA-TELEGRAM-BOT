const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "3.2.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Album system with add, list, create, delete and reply using bot.once",
    category: "media",
    countDown: 5
  },

  onStart: async ({ bot, api, event, args }) => {
    const chatId = event.chat.id;
    const input = args.join(" ").trim();

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;
    const Imgur = apis.data.imgur;

    // 📄 List
    if (input === "list" || input === "") {
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let msg = "🎬 *Album Categories:*\n\n";
      lines.forEach((line, i) => {
        const match = line.match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          const cat = match[2];
          categories.push(cat);
          msg += `${i + 1}. ${cat} Video\n`;
        }
      });

      msg += `\n📝 Reply with number (1-${categories.length})`;

      const sent = await api.sendMessage(chatId, msg, { parse_mode: "Markdown" });

      bot.once("message", async (reply) => {
        const number = parseInt(reply.text);
        if (isNaN(number) || number < 1 || number > categories.length)
          return api.sendMessage(chatId, `⚠️ Enter number 1 to ${categories.length}`);

        const category = categories[number - 1];
        const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(category)}`);
        const { url, cp, count } = res.data;

        await api.sendVideo(chatId, url, {
          caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
          reply_markup: {
            inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]]
          }
        });
      });

      return;
    }

    // ➕ Create
    if (input.startsWith("create ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `✅ ${res.data.message}`);
    }

    // ➖ Delete
    if (input.startsWith("delete ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `🗑️ ${res.data.message}`);
    }

    // 📤 Add media
    if (input.startsWith("add ")) {
      const category = input.slice(4).trim();
      await api.sendMessage(chatId, `📥 Send media now to add to *${category}*`, { parse_mode: "Markdown" });

      bot.once("message", async (msg) => {
        const file = msg.video || msg.photo?.[msg.photo.length - 1];
        if (!file) return api.sendMessage(chatId, "❗ No media detected.");

        const link = await api.getFileLink(file.file_id);
        const upload = await axios.get(`${Imgur}/imgur?url=${encodeURIComponent(link)}`);
        const imgurLink = upload.data.link || upload.data.uploaded?.image;

        await axios.get(`${Shaon}/album?add=${encodeURIComponent(category)}&url=${encodeURIComponent(imgurLink)}`);
        return api.sendMessage(chatId, `✅ Media added to *${category}*`, { parse_mode: "Markdown" });
      });

      return;
    }

    // ▶️ View random video by category
    if (input) {
      try {
        const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(input)}`);
        const { url, cp, category, count } = res.data;

        await api.sendVideo(chatId, url, {
          caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
          reply_markup: {
            inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]]
          }
        });
      } catch (e) {
        api.sendMessage(chatId, "❌ Failed to load video.");
      }
    }
  }
};
