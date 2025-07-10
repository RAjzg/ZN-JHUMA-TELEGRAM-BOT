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
    version: "7.1.0",
    author: "dipto & fixed by Shaon",
    countDown: 0,
    role: 0,
    description: "Better than Simsimi",
    category: "chat",
    guide: {
      en: "{pn} [text]\n{pn} teach প্রশ্ন - উত্তর[,উত্তর২...]\n{pn} edit প্রশ্ন - পুরাতন - নতুন\n{pn} delete প্রশ্ন - উত্তর\n{pn} list\n{pn} msg প্রশ্ন"
    }
  },

  onStart: async ({ api, event, args, usersData, message }) => {
    const base = await baseApiUrl();
    const link = `${base}/sim`;
    const text = args.join(" ").trim();
    const uid = event.senderID;

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

        const res = await axios.get(`${link}?teach=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}&senderName=${encodeURIComponent(senderName)}`);
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

      // 📩 MSG
      if (text.startsWith("msg ")) {
        const q = text.slice(4).trim();
        const res = await axios.get(`${link}?list=${encodeURIComponent(q)}`);
        const entry = res.data.data?.find(i => i.ask.toLowerCase() === q.toLowerCase());
        if (!entry) return message.reply("❌ Question not found.");
        return message.reply(`📩 Replies for "${entry.ask}":\n${entry.ans.map((a, i) => `${i + 1}. ${a}`).join("\n")}`);
      }

      // 🤖 DEFAULT CHAT
      const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`);
      const response = res.data.response?.[0] || "🤖 আমি কিছুই বুঝতে পারছি না!";
      const info = await message.reply(response);

      global.functions.onReply.set(info.message_id, {
        commandName: "baby",
        type: "reply",
        messageID: info.message_id,
        author: uid,
        senderName
      });

    } catch (e) {
      console.error("BABY Error:", e);
      return message.reply("❌ Error occurred. Please try again later.");
    }
  },

  onReply: async function ({ api, event, message, Reply }) {
  const link = `${await baseApiUrl()}/sim`;
  const uid = event.senderID || event.from?.id; // ✅ uid define করা
  const replyText = event.body?.toLowerCase().trim();

  if (!replyText) return;

  try {
    const res = await axios.get(`${link}?text=${encodeURIComponent(replyText)}&senderID=${uid}`);
    const data = res.data.response || "❌ No response.";
    const info = await message.reply(data);

    global.functions.onReply.set(info.message_id, {
      commandName: 'baby',
      type: "reply",
      messageID: info.message_id,
      author: uid,
      link: data,
    });
  } catch (e) {
    console.error("BABY Reply Error:", e);
    return message.reply("❌ Reply error.");
  }
}
};
