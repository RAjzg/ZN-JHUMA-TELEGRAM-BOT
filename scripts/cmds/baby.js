const axios = require("axios");

// 🔗 Base API URL fetcher
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
  return base.data.api;
};

let replyTrack = {}; // রিপ্লাই ট্র্যাক রাখার জন্য

module.exports = {
  config: {
    name: "baby",
    aliases: ["baby", "bbe", "babe", "bby"],
    version: "8.0.0",
    author: "dipto & fixed by Shaon",
    countDown: 0,
    role: 0,
    description: "Better than Simsimi with reply system",
    category: "chat",
    guide: {
      en: "{pn} [text]\n{pn} teach প্রশ্ন - উত্তর[,উত্তর২...]\n{pn} edit প্রশ্ন - পুরাতন - নতুন\n{pn} delete প্রশ্ন - উত্তর\n{pn} list"
    }
  },

  // ⏩ START
  onStart: async ({ api, event, args, usersData, message, bot }) => {
    const base = await baseApiUrl();
    const link = `${base}/sim`;
    const text = args.join(" ").trim();
    const uid = event.senderID;
    const senderName = await usersData.getName(uid) || "Unknown";

    if (!text) {
      const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi", "yes baby", "hey baby😃"];
      return message.reply(ran[Math.floor(Math.random() * ran.length)]);
    }

    try {
      // ➕ TEACH
      if (text.startsWith("teach ")) {
        const match = text.match(/^teach\s+(.+?)\s*-\s*(.+)$/);
        if (!match) return message.reply("❌ Use: teach প্রশ্ন - উত্তর[,উত্তর২...]");

        const q = match[1].trim();
        const a = match[2].trim();

        const res = await axios.get(
          `${link}?teach&ask=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}&senderName=${encodeURIComponent(senderName)}`
        );
        return message.reply(`✅ ${res.data.message}\n👤 Teacher: ${res.data.author}\n💬 Replies: ${res.data.replies?.join(", ") || "None"}`);
      }

      // ✏️ EDIT
      if (text.startsWith("edit ")) {
        const parts = text.slice(5).split(/\s*-\s*/);
        if (parts.length !== 3) return message.reply("❌ Use: edit প্রশ্ন - পুরাতন - নতুন");
        const [q, oldR, newR] = parts;
        const res = await axios.get(
          `${link}?edit=${encodeURIComponent(q)}&old=${encodeURIComponent(oldR)}&new=${encodeURIComponent(newR)}`
        );
        return message.reply(`✏️ ${res.data.message}`);
      }

      // 🗑️ DELETE
      if (text.startsWith("delete ")) {
        const parts = text.slice(7).split(/\s*-\s*/);
        if (parts.length !== 2) return message.reply("❌ Use: delete প্রশ্ন - উত্তর");
        const [q, a] = parts;
        const res = await axios.get(
          `${link}?delete=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}`
        );
        return message.reply(`🗑️ ${res.data.message}`);
      }

      // 📋 LIST
      if (text === "list") {
        const res = await axios.get(`${link}?list=all`);
        return message.reply(`🧠 Total Questions: ${res.data.totalQuestions}\n💬 Total Replies: ${res.data.totalReplies}`);
      }

      // 🤖 DEFAULT CHAT
      const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`);
      const response = res.data.response?.[0] || "🤖 আমি কিছুই বুঝতে পারছি না!";
      const info = await message.reply(response);

      // ✅ reply track এ সংরক্ষণ করা
      replyTrack[info.message_id] = { senderName, link };
    } catch (e) {
      console.error("BABY Error:", e);
      return message.reply("❌ Error occurred. Please try again later.");
    }
  },

  // ⏩ REPLY HANDLER
  onLoad: async ({ bot, api }) => {
    bot.on("message", async (msg) => {
      try {
        if (!msg.reply_to_message) return;

        const repliedId = msg.reply_to_message.message_id;
        if (!replyTrack[repliedId]) return; // ট্র্যাক না থাকলে skip

        const { senderName, link } = replyTrack[repliedId];
        const text = msg.text?.trim();
        if (!text) return;

        // teach, edit, delete, list হ্যান্ডেল করা যাবে reply থেকেও
        if (text.startsWith("teach ") || text.startsWith("edit ") || text.startsWith("delete ") || text === "list") {
          // event simulate করার মত করে সরাসরি onStart কল করা
          return module.exports.onStart({
            api,
            event: { senderID: msg.from.id },
            args: text.split(" "),
            usersData: { getName: async () => senderName },
            message: { reply: (t) => api.sendMessage(msg.chat.id, t, { reply_to_message_id: msg.message_id }) },
            bot
          });
        }

        // 🤖 DEFAULT CHAT
        const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`);
        const response = res.data.response?.[0] || "🤖 আমি কিছুই বুঝতে পারছি না!";
        const sent = await api.sendMessage(msg.chat.id, response, { reply_to_message_id: msg.message_id });

        // ✅ নতুন রিপ্লাই ট্র্যাক করা
        replyTrack[sent.message_id] = { senderName, link };
      } catch (err) {
        console.error("Reply Error:", err);
        api.sendMessage(msg.chat.id, "❌ রিপ্লাই দিতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
      }
    });
  }
};
