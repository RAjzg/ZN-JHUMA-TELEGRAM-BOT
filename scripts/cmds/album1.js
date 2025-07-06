const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "3.2.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Album with add, list, create, delete, and reply-based view",
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

      let msg = "🎬 *VIDEO ALBUM* 📁\n";
      lines.forEach((line, i) => {
        const match = line.match(/(\d+)\. Total (.*?) videos available/);
        if (match) {
          const cat = match[2];
          categories.push(cat);
          msg += `${i + 1}. ${cat} Video\n`;
        }
      });

      msg += `\n✨ Reply with number to get a video`;

      const sent = await api.sendMessage(chatId, msg, {
        parse_mode: "Markdown"
      });

      global.telegram._reply = global.telegram._reply || {};
      global.telegram._reply[sent.message_id] = {
        type: "get_video",
        categories,
      };

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
      const msg = await api.sendMessage(chatId, `📥 Send a media file now to add to *${category}*`, {
        parse_mode: "Markdown"
      });

      global.telegram._reply = global.telegram._reply || {};
      global.telegram._reply[msg.message_id] = {
        type: "add_media",
        category,
        Imgur,
        Shaon
      };

      return;
    }

    // ▶️ RANDOM VIEW
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
  },

  reply: async ({ bot, api, event }) => {
    const { message_id, reply_to_message, text, video, photo } = event;
    const repliedMsg = reply_to_message;
    if (!repliedMsg || !global.telegram._reply?.[repliedMsg.message_id]) return;

    const data = global.telegram._reply[repliedMsg.message_id];
    const chatId = event.chat.id;

    if (data.type === "get_video") {
      const number = parseInt(text);
      const category = data.categories[number - 1];
      if (!category)
        return api.sendMessage(chatId, "❗ Invalid number.");

      const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
      const Shaon = apis.data.api;

      try {
        const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(category)}`);
        const { url, cp, count } = res.data;

        return await api.sendVideo(chatId, url, {
          caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`
        });
      } catch (e) {
        return api.sendMessage(chatId, "❌ Failed to load video.");
      }
    }

    if (data.type === "add_media") {
      const media = video || (photo && photo[photo.length - 1]);
      if (!media)
        return api.sendMessage(chatId, "❗ No media detected.");

      try {
        const fileLink = await api.getFileLink(media.file_id);
        const upload = await axios.get(`${data.Imgur}/imgur?link=${encodeURIComponent(fileLink)}`);
        const imgurLink = upload.data.link || upload.data.uploaded?.image;

        await axios.get(`${data.Shaon}/album?add=${encodeURIComponent(data.category)}&url=${encodeURIComponent(imgurLink)}`);
        return api.sendMessage(chatId, `✅ Media added to *${data.category}*`, {
          parse_mode: "Markdown"
        });
      } catch (e) {
        return api.sendMessage(chatId, `❌ Failed to add media.`, {
          parse_mode: "Markdown"
        });
      }
    }
  }
};
