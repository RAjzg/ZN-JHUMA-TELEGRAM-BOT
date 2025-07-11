const axios = require("axios");

module.exports = {
  config: {
    name: "result",
    version: "1.0.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "🔍 Check SSC Result via inline buttons",
    commandCategory: "utility",
    cooldowns: 5,
  },

  onStart: async function ({ bot, message }) {
    const inlineExam = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📘 SSC/Dakhil", callback_data: "exam_ssc" }],
        ],
      },
    };

    await bot.sendMessage(message.chat.id, "📘 Select Exam:", inlineExam);
  },

  onReply: async function () {}, // Not used here since we use callback queries

  onCallback: async function ({ bot, callbackQuery }) {
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

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

    if (data === "exam_ssc") {
      const boardKeyboard = boards.map((b) => [
        { text: b.name, callback_data: `board_${b.value}` },
      ]);

      await bot.editMessageText("🏛️ Select Education Board:", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: boardKeyboard,
        },
      });
    }

    if (data.startsWith("board_")) {
      const board = data.split("_")[1];
      const yearButtons = Array.from({ length: 10 }, (_, i) => {
        const year = 2024 - i;
        return [{ text: `${year}`, callback_data: `year_${board}_${year}` }];
      });

      await bot.editMessageText("📆 Select Exam Year:", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: yearButtons,
        },
      });
    }

    if (data.startsWith("year_")) {
      const [, board, year] = data.split("_");

      // Store context to global/session so we can use reply step next
      global.resultInput = { userId, board, year };

      await bot.sendMessage(chatId, "📄 Please enter your *Roll Number*:", {
        parse_mode: "Markdown",
      });

      // Set reply handler
      global.functions.onReply.set(`${chatId}:${userId}:roll`, {
        command: "result",
        type: "roll",
        board,
        year,
      });
    }
  },

  reply: async function ({ bot, message, data }) {
    const { type, board, year } = data;
    const chatId = message.chat.id;
    const text = message.text.trim();

    if (type === "roll") {
      if (!/^\d+$/.test(text)) {
        return bot.sendMessage(chatId, "❌ Invalid Roll. Only numbers allowed.");
      }

      global.functions.onReply.set(`${chatId}:${message.from.id}:reg`, {
        command: "result",
        type: "reg",
        board,
        year,
        roll: text,
      });

      return bot.sendMessage(chatId, "📄 Now enter your *Registration Number*:", {
        parse_mode: "Markdown",
      });
    }

    if (type === "reg") {
      if (!/^\d+$/.test(text)) {
        return bot.sendMessage(chatId, "❌ Invalid Registration number.");
      }

      const { roll } = data;
      const reg = text;
      const url = `https://shaon-ssc-result.vercel.app/result?exam=ssc&board=${board}&year=${year}&roll=${roll}&reg=${reg}`;

      try {
        const res = await axios.get(url);
        if (res.data.status !== "success") {
          return bot.sendMessage(chatId, "❌ Result not found. Please try again.");
        }

        const s = res.data.student;
        const g = res.data.grades.filter((x) => x.subject);
        const grades = g.map(
          (sub) => `📘 *${sub.subject}* ➝ 🎯 Grade: *${sub.grade}*`
        ).join("\n");

        const result = `
🎓 *SSC Exam Result* 📊
━━━━━━━━━━━━━━━━━━━━
👤 Name: \`${s.Name}\`
👨‍👩‍👧‍👦 Father's Name: \`${s["Fathers Name"]}\`
👩 Mother's Name: \`${s["Mothers Name"]}\`
🏫 Institute: \`${s.Institute}\`
📚 Group: \`${s.Group}\`
🏛️ Board: \`${s.Board}\`
🆔 Roll: \`${s["Roll No"]}\`
📅 DOB: \`${s["Date of Birth"]}\`
📋 Type: \`${s.Type}\`
🎯 Result: *${s.Result}*

📖 *Subject-wise Grades:*
${grades}
━━━━━━━━━━━━━━━━━━━━
`;

        await bot.sendMessage(chatId, result, { parse_mode: "Markdown" });
      } catch (e) {
        console.error("Result fetch failed:", e.message);
        await bot.sendMessage(chatId, "❌ Could not fetch result. Try again later.");
      }
    }
  },
};
