const axios = require("axios");

// 🔗 Base API URL fetcher
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
  return base.data.api;
};

module.exports = {
  config: {
    name: "baby",
    aliases: ["baby", "bbe", "babe", "bby"],
    version: "7.2.0",
    author: "Dipto & fixed by Shaon",
    countDown: 0,
    role: 0,
    description: "Better than Simsimi",
    category: "chat",
    guide: {
      en: "{pn} [text]\n{pn} teach প্রশ্ন - উত্তর[,উত্তর২...]\n{pn} edit প্রশ্ন - পুরাতন - নতুন\n{pn} delete প্রশ্ন - উত্তর\n{pn} list"
    }
  },

  onStart: async ({ api, event, args, usersData, bot, message }) => {
    const base = await baseApiUrl();
    const link = `${base}/sim`;
    const text = args.join(" ").trim();
    const uid = event.senderID;
    const chatId = event.chat?.id || event.threadID;

    if (!text) {
      const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi", "yes baby", "hey baby😃"];
      return message.reply(ran[Math.floor(Math.random() * ran.length)]);
    }

    try {
      const senderName = await usersData.getName(uid) || "Unknown";

      // ➕ TEACH
      if (text.startsWith("teach ")) {
        const match = text.match(/^teach\s+(.+?)\s*-\s*(.+)$/);
        if (!match) return message.reply("❌ Use: teach প্রশ্ন - উত্তর[,উত্তর২...]");

        const q = match[1].trim();
        const a = match[2].trim();

        const res = await axios.get(`${link}?teach&ask=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}&senderName=${encodeURIComponent(senderName)}`);
        return message.reply(`✅ ${res.data.message}\n👤 Teacher: ${res.data.author}\n💬 Replies: ${res.data.replies?.join(", ") || "None"}`);
      }

      // ✏️ EDIT
      if (text.startsWith("edit ")) {
        const parts = text.slice(5).split(/\s*-\s*/);
        if (parts.length !== 3) return message.reply("❌ Use: edit প্রশ্ন - পুরাতন - নতুন");
        const [q, oldR, newR] = parts;
        const res = await axios.get(`${link}?edit=${encodeURIComponent(q)}&old=${encodeURIComponent(oldR)}&new=${encodeURIComponent(newR)}`);
        return message.reply(`✏️ ${res.data.message}`);
      }

      // 🗑️ DELETE
      if (text.startsWith("delete ")) {
        const parts = text.slice(7).split(/\s*-\s*/);
        if (parts.length !== 2) return message.reply("❌ Use: delete প্রশ্ন - উত্তর");
        const [q, a] = parts;
        const res = await axios.get(`${link}?delete=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}`);
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
      await message.reply(response);

      // 🔁 Reply loop using bot.once
      const waitReply = () => {
        bot.once("message", async (replyEvent) => {
          const replyText = replyEvent.text?.trim();
          const replySender = replyEvent.sender?.id || replyEvent.senderID;

          if (!replyText || replySender !== uid) return waitReply(); // Ignore empty or wrong user

          try {
            const res2 = await axios.get(`${link}?text=${encodeURIComponent(replyText)}&senderName=${encodeURIComponent(senderName)}`);
            const responseText = res2.data.response?.[0] || "🤖 আমি কিছুই বুঝতে পারছি না!";
            await api.sendMessage(chatId, responseText);
            waitReply(); // Wait for next reply
          } catch (err) {
            console.error("Reply Error:", err);
            api.sendMessage(chatId, "❌ রিপ্লাই দিতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
          }
        });
      };

      waitReply();

    } catch (e) {
      console.error("BABY Error:", e);
      return message.reply("❌ Error occurred. Please try again later.");
    }
  }
};
