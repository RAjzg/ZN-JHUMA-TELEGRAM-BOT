const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "3.1.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Category album with list, add, delete, create, and reply-view",
    category: "media",
    countDown: 5
  },

  onStart: async ({ bot, api, event, args }) => {
    const chatId = event.chat.id;
    const input = args.join(" ").trim();
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;
    const Imgur = apis.data.imgur;

    // 📄 LIST
    if (input === "list" || input === "") {
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let msg = "🎬 *Album Categories:*\n\n";
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          const cat = match[2];
          categories.push(cat);
          msg += `${i + 1}. ${cat} Video\n`;
        }
      }

      msg += `\n📝 Reply this message with number (e.g., 1)`;

      const sent = await api.sendMessage(chatId, msg, { parse_mode: "Markdown" });

      const replyHandler = async (msg2) => {
        const number = parseInt(msg2.text);
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

        bot.removeListener("message", replyHandler);
      };

      bot.on("message", replyHandler);
      return;
    }

    // ➕ CREATE
    if (input.startsWith("create ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `✅ ${res.data.message}`);
    }

    // ➖ DELETE
    if (input.startsWith("delete ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `🗑️ ${res.data.message}`);
    }

    // 📤 ADD
    if (input.startsWith("add ")) {
      const category = input.slice(4).trim();
      api.sendMessage(chatId, `📥 Send media now to add to *${category}*`, { parse_mode: "Markdown" });

      const mediaHandler = async (msg) => {
        const file = msg.video || msg.photo?.[msg.photo.length - 1];
        if (!file) return;

        try {
          const link = await api.getFileLink(file.file_id);
          const upload = await axios.get(`${Imgur}/imgur?url=${encodeURIComponent(link)}`);
          const imgurLink = upload.data.link || upload.data.uploaded?.image;

          await axios.get(`${Shaon}/album?add=${encodeURIComponent(category)}&url=${encodeURIComponent(imgurLink)}`);
          await api.sendMessage(chatId, `✅ Media added to *${category}*`, { parse_mode: "Markdown" });
        } catch (e) {
          await api.sendMessage(chatId, "❌ Upload failed.");
        }

        bot.removeListener("message", mediaHandler);
      };

      bot.on("message", mediaHandler);
      return;
    }

    // ▶️ RANDOM VIEW by Category
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
