const axios = require("axios");

module.exports = {
  config: {
    name: "album1",
    version: "5.0.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Reply add with bot.once handler (like album)",
    category: "media",
    countDown: 5
  },

  onStart: async ({ api, event, args, bot }) => {
    const chatId = event.chat?.id || event.threadID;
    const input = args.join(" ").trim();

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const baseApi = apis.data.api;
    const imgur = apis.data.imgur;

    // ✅ ADD by reply (same as before)
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();

      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        (event?.reply_to_message?.photo?.length > 0 && event.reply_to_message.photo.slice(-1)[0]);

      if (!file || !file.file_id) {
        return api.sendMessage(chatId, "❗ ভিডিও বা ছবিতে reply করে `/album1 add <category>` দিন।", {
          parse_mode: "Markdown"
        });
      }

      try {
        const fileLink = await api.getFileLink(file.file_id);
        const uploaded = await axios.get(`${imgur}/catbox?url=${encodeURIComponent(fileLink)}`);
        const finalUrl = uploaded.data.url || uploaded.data.uploaded?.image;

        if (!finalUrl) throw new Error("Imgur upload failed");

        await axios.get(`${baseApi}/album?add=${category}&url=${encodeURIComponent(finalUrl)}`);
        return api.sendMessage(chatId, `✅ Added to '${category.toUpperCase()}'\n🔗 ${finalUrl}`);
      } catch (err) {
        console.error("Add failed:", err.message);
        return api.sendMessage(chatId, "❌ মিডিয়া আপলোড বা সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    }

    // 📄 Category list
    if (input === "list" || input === "") {
      const res = await axios.get(`${baseApi}/album?list=true`);
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

      // 🧠 Wait for reply using bot.once
      bot.once("message", async (replyEvent) => {
        const num = parseInt(replyEvent.text);
        if (isNaN(num) || num < 1 || num > categories.length) {
          return api.sendMessage(chatId, `⚠️ Valid number: 1 to ${categories.length}`);
        }

        const category = categories[num - 1];
        try {
          const r = await axios.get(`${baseApi}/album?type=${encodeURIComponent(category)}`);
          const { url, cp, count } = r.data;

          await api.sendVideo(chatId, url, {
            caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
            reply_markup: {
              inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]]
            }
          });
        } catch (err) {
          return api.sendMessage(chatId, "❌ ভিডিও লোড করা যায়নি।");
        }
      });

      return;
    }

    // ➕ CREATE category
    if (input.startsWith("create ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${baseApi}/album?create=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `✅ ${res.data.message}`);
    }

    // ➖ DELETE category
    if (input.startsWith("delete ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${baseApi}/album?delete=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `🗑️ ${res.data.message}`);
    }

    // ▶️ RANDOM category
    if (input) {
      try {
        const res = await axios.get(`${baseApi}/album?type=${encodeURIComponent(input)}`);
        const { url, cp, category, count } = res.data;

        await api.sendVideo(chatId, url, {
          caption: `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`,
          reply_markup: {
            inline_keyboard: [[{ text: "Owner", url: "https://t.me/shaonproject" }]]
          }
        });
      } catch (e) {
        api.sendMessage(chatId, "❌ ভিডিও লোড করা যায়নি।");
      }
    }
  }
};
