const axios = require("axios");

module.exports = {
  config: {
    name: "album",
    version: "2.0.0",
    role: 0,
    author: "Shaon Ahmed",
    description: "Album system with Imgur and category support",
    category: "media",
    countDown: 5,
  },

  onStart: async ({ event, api, bot }) => {
    const chatId = event.chat.id;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎬 List Categories", callback_data: "list" }],
          [{ text: "➕ Create Category", callback_data: "create" }, { text: "➖ Delete Category", callback_data: "delete" }],
          [{ text: "📤 Add Media", callback_data: "add" }],
          [{ text: "📀 Random from Category", callback_data: "random" }]
        ]
      }
    };

    const wait = await api.sendMessage(chatId, "📁 Select an album option below:", keyboard);

    bot.once("callback_query", async (cb) => {
      const action = cb.data;
      await api.answerCallbackQuery(cb.id);
      const msgId = wait.message_id;

      try {
        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const Shaon = apis.data.api;
        const Imgur = apis.data.imgur;

        if (action === "list") {
          const res = await axios.get(`${Shaon}/album?list=true`);
          return api.sendMessage(chatId, `📚 Album List:\n\n${res.data.data}`, { reply_to_message_id: msgId });

        } else if (action === "create") {
          api.sendMessage(chatId, "📂 Send category name to create:", { reply_to_message_id: msgId });

          bot.once("message", async (msg) => {
            const name = msg.text;
            const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(name)}`);
            api.sendMessage(chatId, `✅ ${res.data.message}`, { reply_to_message_id: msg.message_id });
          });

        } else if (action === "delete") {
          api.sendMessage(chatId, "🗑️ Send category name to delete:", { reply_to_message_id: msgId });

          bot.once("message", async (msg) => {
            const name = msg.text;
            const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(name)}`);
            api.sendMessage(chatId, `🧹 ${res.data.message}`, { reply_to_message_id: msg.message_id });
          });

        } else if (action === "add") {
          api.sendMessage(chatId, "📷 Send video/photo with caption as category name:", { reply_to_message_id: msgId });

          bot.once("message", async (msg) => {
            const file = msg.video || msg.photo?.[msg.photo.length - 1];
            const caption = msg.caption;

            if (!file || !caption)
              return api.sendMessage(chatId, "❗ Send a media file with category name in caption.", { reply_to_message_id: msg.message_id });

            const link = await api.getFileLink(file.file_id);
            const imgurUpload = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(link)}`);
            const imgurLink = imgurUpload.data.link;

            await axios.get(`${Shaon}/album?add=${encodeURIComponent(caption)}&url=${encodeURIComponent(imgurLink)}`);
            api.sendMessage(chatId, `✅ Media added to '${caption}' category`, { reply_to_message_id: msg.message_id });
          });

        } else if (action === "random") {
          api.sendMessage(chatId, "🎯 Send category name to get random video:", { reply_to_message_id: msgId });

          bot.once("message", async (msg) => {
            const name = msg.text;
            const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(name)}`);
            const videoUrl = res.data.url;
            const caption = res.data.cp || "";

            await api.sendVideo(chatId, videoUrl, {
              caption: `${caption}\n🎞️ Category: ${res.data.category}\n🎬 Total: ${res.data.count || 1}`,
              reply_markup: { inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]] },
              reply_to_message_id: msg.message_id
            });
          });
        }
      } catch (e) {
        console.error(e.message);
        return api.sendMessage(chatId, `❌ Error: ${e.message}`);
      }
    });
  }
};
