const axios = require("axios");

module.exports = {
  config: {
    name: "album",
    version: "2.2.0",
    role: 0,
    author: "Shaon Ahmed",
    description: "Album system with add via reply and category view via inline keyboard",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ api, event, args, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // ➕ Add command via reply
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();
      return api.sendMessage(
        chatId,
        `📥 Reply to this message with a video or image to add to '${category.toUpperCase()}'`,
        {},
        (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            type: "add",
            author: event.senderID,
            category,
            messageID: info.messageID,
          });
        }
      );
    }

    // 🎬 Inline video selection menu
    const videoSelectionMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Love', callback_data: '/video/love' }, { text: 'CPL', callback_data: '/video/cpl' }],
          [{ text: 'Short Video', callback_data: '/video/shortvideo' }, { text: 'Sad Video', callback_data: '/video/sadvideo' }],
          [{ text: 'Status', callback_data: '/video/status' }, { text: 'Shairi', callback_data: '/video/shairi' }],
          [{ text: 'Baby', callback_data: '/video/baby' }, { text: 'Anime', callback_data: '/video/anime' }],
          [{ text: 'FF', callback_data: '/video/ff' }, { text: 'Lofi', callback_data: '/video/lofi' }],
          [{ text: 'Happy', callback_data: '/video/happy' }, { text: 'Football', callback_data: '/video/football' }],
          [{ text: 'Islam', callback_data: '/video/islam' }, { text: 'Humaiyun', callback_data: '/video/humaiyun' }],
          [{ text: 'Capcut', callback_data: '/video/capcut' }, { text: 'Sex', callback_data: '/video/sex' }],
          [{ text: 'Horny', callback_data: '/video/horny' }, { text: 'Hot', callback_data: '/video/hot' }],
          [{ text: 'Random', callback_data: '/video/random' }]
        ]
      }
    };

    const waitMsg = await api.sendMessage(chatId, "🎬 Select a video category:", videoSelectionMarkup);

    bot.once("callback_query", async (callbackQuery) => {
      const categoryEndpoint = callbackQuery.data;
      await api.answerCallbackQuery(callbackQuery.id);

      const loadingMsg = await api.sendMessage(chatId, "⏳ Fetching video...", { reply_to_message_id: waitMsg.message_id });

      try {
        const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
        const base = apis.data.api;

        const res = await axios.get(`${base}${categoryEndpoint}`);
        const videoUrl = res.data.data || res.data.url;
        const caption = res.data.shaon || res.data.cp || "🎥 Here's your video:";

        if (!videoUrl) throw new Error("No video found");

        await api.sendVideo(chatId, videoUrl, {
          caption,
          reply_to_message_id: waitMsg.message_id,
          reply_markup: {
            inline_keyboard: [[{ text: "🧑‍💻 Owner", url: "https://t.me/shaonproject" }]]
          }
        });

        await api.deleteMessage(chatId, loadingMsg.message_id);
        await api.deleteMessage(chatId, waitMsg.message_id);
      } catch (err) {
        await api.deleteMessage(chatId, loadingMsg.message_id);
        await api.sendMessage(chatId, `❌ Error: ${err.message}`, { reply_to_message_id: waitMsg.message_id });
      }
    });
  },

  reply: async ({ api, event, reply }) => {
    if (event.senderID !== reply.author) return;

    const fileId =
      event?.reply_to_message?.photo?.slice(-1)[0]?.file_id ||
      event?.reply_to_message?.video?.file_id;

    if (!fileId) {
      return api.sendMessage(event.threadID, "❗ Please reply with a valid video or image.");
    }

    try {
      const fileLink = await api.getFileLink(fileId);
      const imgurUpload = `https://web-api-delta.vercel.app/imgur?url=${encodeURIComponent(fileLink)}`;
      const imgurRes = await axios.get(imgurUpload);
      const imgurLink = imgurRes.data.link;

      const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
      const base = apis.data.api;

      const addApi = `${base}/video/${reply.category}?add=${reply.category}&url=${encodeURIComponent(imgurLink)}`;
      await axios.get(addApi);

      return api.sendMessage(event.threadID, `✅ Added to '${reply.category.toUpperCase()}'\n🔗 ${imgurLink}`);
    } catch (err) {
      return api.sendMessage(event.threadID, "❌ Failed to upload or add.");
    }
  },
};
