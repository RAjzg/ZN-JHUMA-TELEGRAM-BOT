const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "3.1.1",
    author: "Shaon Ahmed",
    role: 0,
    description: "Album system with reply-based add/view",
    category: "media",
    countDown: 5
  },

  onStart: async ({ bot, api, event, args }) => {
    const chatId = event.chat.id;
    const input = args.join(" ").trim();
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;
    const Imgur = apis.data.imgur;

    // Show Category List
    if (input === "list" || input === "") {
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let msg = "🎬 *VIDEO ALBUM*\n";
      lines.forEach((line, i) => {
        const match = line.match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          const cat = match[2];
          categories.push(cat);
          msg += `${i + 1}. ${cat} Video\n`;
        }
      });
      msg += "\n✨ Reply with number to get a video";

      const sent = await api.sendMessage(chatId, msg, { parse_mode: "Markdown" });
      global.telegram._reply = global.telegram._reply || [];
      global.telegram._reply.push({
        name: "album1",
        type: "list",
        message_id: sent.message_id,
        categories,
        chat_id: chatId
      });
      return;
    }

    // Add Media
    if (input.startsWith("add ")) {
      const category = input.slice(4).trim();
      const confirm = await api.sendMessage(chatId, `📤 Send media now to add to *${category}*`, { parse_mode: "Markdown" });
      global.telegram._reply = global.telegram._reply || [];
      global.telegram._reply.push({
        name: "album1",
        type: "add",
        message_id: confirm.message_id,
        chat_id: chatId,
        category,
        imgur: Imgur,
        api: Shaon
      });
      return;
    }

    // Create Category
    if (input.startsWith("create ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `✅ ${res.data.message}`);
    }

    // Delete Category
    if (input.startsWith("delete ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `🗑️ ${res.data.message}`);
    }

    // Direct category view
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
        return api.sendMessage(chatId, "❌ Failed to load video.");
      }
    }
  },

  reply: async ({ bot, api, event }) => {
    const data = global.telegram._reply?.find(
      x => x.message_id === event.message.reply_to_message?.message_id && x.chat_id === event.chat.id
    );
    if (!data) return;

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.api;

    if (data.type === "list") {
      const number = parseInt(event.message.text);
      if (isNaN(number) || number < 1 || number > data.categories.length)
        return api.sendMessage(event.chat.id, "⚠️ Invalid number.");

      const category = data.categories[number - 1];
      const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(category)}`);
      const { url, cp, count } = res.data;

      await api.sendVideo(event.chat.id, url, {
        caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
        reply_markup: {
          inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]]
        }
      });
    }

    if (data.type === "add") {
      const media = event.message.video || (event.message.photo && event.message.photo[event.message.photo.length - 1]);
      if (!media) return api.sendMessage(event.chat.id, "❗ No media detected.");

      const fileLink = await api.getFileLink(media.file_id);
      const upload = await axios.get(`${data.imgur}/imgur?link=${encodeURIComponent(fileLink)}`);
      const imgurLink = upload.data.link || upload.data.uploaded?.image;

      await axios.get(`${data.api}/album?add=${encodeURIComponent(data.category)}&url=${encodeURIComponent(imgurLink)}`);
      return api.sendMessage(event.chat.id, `✅ Media added to *${data.category}*`, { parse_mode: "Markdown" });
    }
  }
};
