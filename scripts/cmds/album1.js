const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "album1",
    version: "5.2.1",
    author: "Shaon Ahmed + Fixed by ChatGPT",
    role: 0,
    description: "Album system with reliable cache streaming (message.stream)",
    category: "media",
    countDown: 5
  },

  onStart: async ({ api, event, args, bot, message }) => {
    const chatId = event.chat?.id || event.threadID;
    const input = args.join(" ").trim();

    // ensure cache dir
    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const baseApi = apis.data.api;
    const imgur = apis.data.imgur;

    // helper: download stream -> file
    async function downloadToFile(url, destPath) {
      const res = await axios.get(url, { responseType: "stream", headers: { "User-Agent": "Mozilla/5.0" } });
      return await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(destPath);
        res.data.pipe(writer);
        res.data.on("error", (err) => {
          writer.close();
          reject(err);
        });
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
        writer.on("finish", () => resolve());
      });
    }

    // helper: send via message.stream if available, else api.sendVideo fallback
    async function streamFileToChat(filePath, caption) {
      try {
        if (message && typeof message.stream === "function") {
          await message.stream({ url: fs.createReadStream(filePath), caption });
        } else {
          // fallback: api.sendVideo with stream
          await api.sendVideo(chatId, fs.createReadStream(filePath), { caption });
        }
      } catch (err) {
        throw err;
      }
    }

    // ADD by reply (same as before)
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();
      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        (event?.reply_to_message?.photo?.length > 0 && event.reply_to_message.photo.slice(-1)[0]);

      if (!file || !file.file_id) {
        return api.sendMessage(chatId, "❗ ভিডিও বা ছবিতে reply করে `/album1 add <category>` দিন।");
      }

      try {
        const fileLink = await api.getFileLink(file.file_id);
        const isVideo = !!event?.reply_to_message?.video;
        const duration = event?.reply_to_message?.video?.duration || 0;

        let finalUrl = null;
        if (isVideo && duration > 60) {
          const catboxUpload = await axios.get(`${imgur}/catbox?url=${encodeURIComponent(fileLink)}`);
          finalUrl = catboxUpload.data.url || catboxUpload.data.link;
        } else {
          const imgurUpload = await axios.get(`${imgur}/imgur?link=${encodeURIComponent(fileLink)}`);
          finalUrl = imgurUpload.data.link || imgurUpload.data.uploaded?.image;
        }

        if (!finalUrl) throw new Error("Upload failed");
        await axios.get(`${baseApi}/album?add=${category}&url=${encodeURIComponent(finalUrl)}`);
        return api.sendMessage(chatId, `✅ Added to '${category.toUpperCase()}'\n🔗 ${finalUrl}`);
      } catch (err) {
        console.error("Add failed:", err);
        return api.sendMessage(chatId, "❌ মিডিয়া আপলোড বা সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    }

    // LIST
    if (input === "list" || input === "") {
      try {
        const res = await axios.get(`${baseApi}/album?list=true`);
        const lines = (res.data.data || "").split("\n");
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
        const listMessageId = sent.message_id;

        // use once to avoid duplicate listeners
        bot.once("message", async (replyEvent) => {
          try {
            if (!replyEvent.reply_to_message || replyEvent.reply_to_message.message_id !== listMessageId) return;
            const num = parseInt(replyEvent.text);
            if (isNaN(num) || num < 1 || num > categories.length) {
              return api.sendMessage(chatId, `⚠️ Valid number: 1 to ${categories.length}`);
            }

            const category = categories[num - 1];
            const r = await axios.get(`${baseApi}/album?type=${encodeURIComponent(category)}`);
            const { url, cp, count } = r.data;

            const uniqueName = `video_${Date.now()}_${Math.random().toString(36).slice(2,8)}.mp4`;
            const filePath = path.join(cacheDir, uniqueName);

            // download and stream
            await api.sendMessage(chatId, "⏬ ডাউনলোড শুরু করছি..."); // optional progress msg
            await downloadToFile(url, filePath);

            await streamFileToChat(filePath, `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`);

            // cleanup
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
            // delete list message
            await api.deleteMessage(chatId, listMessageId);
          } catch (err) {
            console.error("List selection error:", err);
            api.sendMessage(chatId, "❌ ভিডিও লোড করা যায়নি।");
          }
        });

        return;
      } catch (err) {
        console.error("List error:", err);
        return api.sendMessage(chatId, "❌ লিস্ট আনা যায়নি।");
      }
    }

    // create / delete (same)
    if (input.startsWith("create ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${baseApi}/album?create=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `✅ ${res.data.message}`);
    }
    if (input.startsWith("delete ")) {
      const name = input.slice(7).trim();
      const res = await axios.get(`${baseApi}/album?delete=${encodeURIComponent(name)}`);
      return api.sendMessage(chatId, `🗑️ ${res.data.message}`);
    }

    // RANDOM / direct category play
    if (input) {
      let filePath = null;
      try {
        const res = await axios.get(`${baseApi}/album?type=${encodeURIComponent(input)}`);
        const { url, cp, category, count } = res.data;

        const uniqueName = `video_${Date.now()}_${Math.random().toString(36).slice(2,8)}.mp4`;
        filePath = path.join(cacheDir, uniqueName);

        await api.sendMessage(chatId, "⏬ ডাউনলোড শুরু করছি...");
        await downloadToFile(url, filePath);

        await streamFileToChat(filePath, `🎞️ Category: ${category}\n📦 Total: ${count || 1}\n\n${cp || ""}`);
      } catch (err) {
        console.error("Random/play error:", err);
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
        return api.sendMessage(chatId, "❌ ভিডিও লোড করা যায়নি।");
      } finally {
        // ensure cleanup (redundant safe)
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      }
    }
  }
};
