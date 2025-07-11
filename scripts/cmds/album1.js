const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "3.2.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Album category command with list, add, delete, create and reply system",
    category: "media",
    countDown: 5,
  },

  onStart: async ({ bot, api, event, args }) => {
    const chatId = event.chat.id;
    const input = args.join(" ").trim();

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;
    const Imgur = apis.data.imgur;

    // 📄 LIST (or default /album1)
    if (input === "list" || input === "") {
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let msg = "🎬 *🎞 VIDEO ALBUM 『*\n";
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          const cat = match[2];
          categories.push(cat);
          msg += `${i + 1}. ${cat} Video\n`;
        }
      }

      msg += "\n✨ Reply with number to get a video";
      const sent = await api.sendMessage(chatId, msg, { parse_mode: "Markdown" });

      bot.once("message", async (reply) => {
        const number = parseInt(reply.text);
        if (isNaN(number) || number < 1 || number > categories.length)
          return api.sendMessage(chatId, `⚠️ Enter number 1 to ${categories.length}`);

        const category = categories[number - 1];
        try {
          const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(category)}`);
          const { url, cp, count } = res.data;

          await api.sendVideo(chatId, url, {
            caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
            reply_markup: {
              inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]],
            },
          });
        } catch {
          api.sendMessage(chatId, `❌ No video found in *${category}*`, { parse_mode: "Markdown" });
        }
      });
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

      bot.once("message", async (msg) => {
        const file = msg.video || msg.photo?.[msg.photo.length - 1];
        if (!file) return api.sendMessage(chatId, "❗ No media detected.");

        try {
          const fileUrl = await api.getFileLink(file.file_id);
          const uploaded = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(fileUrl)}`);
          const imgurLink = uploaded.data.link || uploaded.data.uploaded?.image;

          await axios.get(`${Shaon}/album?add=${encodeURIComponent(category)}&url=${encodeURIComponent(imgurLink)}`);
          return api.sendMessage(chatId, `✅ Media added to *${category}*`, { parse_mode: "Markdown" });
        } catch {
          return api.sendMessage(chatId, "❌ Failed to upload media.");
        }
      });
      return;
    }

    // ▶️ DIRECT CATEGORY VIDEO
    if (input) {
      try {
        const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(input)}`);
        const { url, cp, category, count } = res.data;

        await api.sendVideo(chatId, url, {
          caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
          reply_markup: {
            inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]],
          },
        });
      } catch {
        return api.sendMessage(chatId, "❌ Failed to load video.");
      }
    }
  }
};
