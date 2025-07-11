const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "1.0.3",
  author: "Shaon Ahmed",
  role: 0,
  description: "Check SSC result with reply",
  commandCategory: "utility",
  usages: "/result",
  cooldowns: 3,
};

const boards = [
  { name: "Barisal", value: "barisal" },
  { name: "Chittagong", value: "chittagong" },
  { name: "Comilla", value: "comilla" },
  { name: "Dhaka", value: "dhaka" },
  { name: "Mymensingh", value: "mymensingh" },
  { name: "Dinajpur", value: "dinajpur" },
  { name: "Jessore", value: "jessore" },
  { name: "Rajshahi", value: "rajshahi" },
  { name: "Sylhet", value: "sylhet" },
  { name: "Madrasah", value: "madrasah" },
  { name: "Technical", value: "tec" },
];

module.exports.run = async function ({ bot, message, chatId }) {
  const list = `📘 *Select Exam Type:*\n\n1️⃣ 🧪 *SSC*`;
  const sent = await bot.sendMessage(chatId, list, { parse_mode: "Markdown" });
  global.functions.onReply.set(sent.message_id, {
    commandName: this.config.name,
    step: 1,
    deleteMsgId: sent.message_id,
  });
};

module.exports.onReply = async function ({ bot, msg, chatId, data }) {
  const text = msg.text.trim();
  const step = data.step || 1;

  if (data.deleteMsgId) {
    try {
      await bot.deleteMessage(chatId, data.deleteMsgId);
    } catch {}
  }

  if (step === 1) {
    const boardList = boards.map((b, i) => `${i + 1}. 🏛️ *${b.name}*`).join("\n");
    const sent = await bot.sendMessage(
      chatId,
      `🏛️ *Select Your Education Board:*\n\n${boardList}\n\n🔢 *Reply with number (e.g., 4 for Dhaka)*`,
      { parse_mode: "Markdown" }
    );
    global.functions.onReply.set(sent.message_id, {
      commandName: this.config.name,
      step: 2,
      deleteMsgId: sent.message_id,
    });
  }

  if (step === 2) {
    const index = parseInt(text) - 1;
    if (isNaN(index) || index < 0 || index >= boards.length) {
      return bot.sendMessage(chatId, "🚫 *Invalid board selection.*", { parse_mode: "Markdown" });
    }
    const board = boards[index].value;
    const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
    const yearList = years.map((y, i) => `${i + 1}. 📅 *${y}*`).join("\n");
    const sent = await bot.sendMessage(
      chatId,
      `📆 *Select Exam Year:*\n\n${yearList}\n\n🔢 *Reply with number (e.g., 24 for 2023)*`,
      { parse_mode: "Markdown" }
    );
    global.functions.onReply.set(sent.message_id, {
      commandName: this.config.name,
      step: 3,
      board,
      deleteMsgId: sent.message_id,
    });
  }

  if (step === 3) {
    const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
    const index = parseInt(text) - 1;
    if (isNaN(index) || index < 0 || index >= years.length) {
      return bot.sendMessage(chatId, "🚫 *Invalid year selection.*", { parse_mode: "Markdown" });
    }
    const year = years[index];
    const sent = await bot.sendMessage(chatId, "🔢 *Enter your Roll Number:*\n\n📌 *Only digits allowed*", { parse_mode: "Markdown" });
    global.functions.onReply.set(sent.message_id, {
      commandName: this.config.name,
      step: 4,
      board: data.board,
      year,
      deleteMsgId: sent.message_id,
    });
  }

  if (step === 4) {
    if (!/^\d+$/.test(text)) {
      return bot.sendMessage(chatId, "🚫 *Invalid roll number.* Please enter digits only.", { parse_mode: "Markdown" });
    }
    const sent = await bot.sendMessage(chatId, "📝 *Enter your Registration Number:*\n\n📌 *Only digits allowed*", { parse_mode: "Markdown" });
    global.functions.onReply.set(sent.message_id, {
      commandName: this.config.name,
      step: 5,
      board: data.board,
      year: data.year,
      roll: text,
      deleteMsgId: sent.message_id,
    });
  }

  if (step === 5) {
    if (!/^\d+$/.test(text)) {
      return bot.sendMessage(chatId, "🚫 *Invalid registration number.* Please enter digits only.", { parse_mode: "Markdown" });
    }

    const reg = text;
    const { board, year, roll } = data;
    const url = `https://shaon-ssc-result.vercel.app/result?exam=ssc&board=${board}&year=${year}&roll=${roll}&reg=${reg}`;

    try {
      const res = await axios.get(url);

      if (res.data.status !== "success") {
        return bot.sendMessage(chatId, "❌ *Result not found. Please check your info and try again.*", { parse_mode: "Markdown" });
      }

      const s = res.data.student;
      const g = res.data.grades.filter(x => x.subject);
      const grades = g.map(sub => `📚 *${sub.subject}* ➝ 🎯 Grade: *${sub.grade}*`).join("\n\n");

      const result = `
🎓 *SSC Exam Result* 📊
━━━━━━━━━━━━━━━━━━━━━━

👤 *Student Name:* \`${s.Name}\`
👨‍👩‍👧‍👦 *Father's Name:* \`${s["Fathers Name"]}\`
👩 *Mother's Name:* \`${s["Mothers Name"]}\`
🏫 *Institute:* \`${s.Institute}\`
📚 *Group:* \`${s.Group}\`
🏛️ *Board:* \`${s.Board}\`
🆔 *Roll No:* \`${s["Roll No"]}\`
📆 *Date of Birth:* \`${s["Date of Birth"]}\`
📋 *Exam Type:* \`${s.Type}\`
🎯 *Final Result:* *${s.Result}*

━━━━━━━━━━━━━━━━━━━━━━
📖 *Subject-wise Grades:*

${grades}
━━━━━━━━━━━━━━━━━━━━━━`;

      await bot.sendMessage(chatId, result, { parse_mode: "Markdown" });

    } catch (err) {
      console.error("Result fetch error:", err);
      await bot.sendMessage(chatId, "❌ *Could not fetch result. Please try again later.*", { parse_mode: "Markdown" });
    }
  }
};
