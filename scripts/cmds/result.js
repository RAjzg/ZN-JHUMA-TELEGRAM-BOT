const axios = require("axios");

module.exports = {
  config: {
    name: "result",
    version: "1.0.0",
    role: 0,
    author: "Shaon Ahmed",
    description: "SSC Result Checker with Inline UI",
    category: "Education",
    countDown: 5,
  },

  onStart: async ({ api, event, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // Step 1: Select Exam Type (currently only SSC)
    const msg = await api.sendMessage(chatId, "📘 Select Exam Type:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📘 SSC", callback_data: "exam:ssc" }]
        ]
      }
    });

    bot.once("callback_query", async (query) => {
      const step = query.data.split(":")[0];
      if (step !== "exam") return;

      const exam = query.data.split(":")[1];
      await api.answerCallbackQuery(query.id);

      // Step 2: Select Board
      const boards = [
        "barisal", "chittagong", "comilla", "dhaka", "dinajpur",
        "jessore", "mymensingh", "rajshahi", "sylhet", "madrasah", "tec"
      ];

      const buttons = boards.map(b => [{ text: b.toUpperCase(), callback_data: `board:${b}:${exam}` }]);
      const boardMsg = await api.sendMessage(chatId, "🏛️ Select Board:", {
        reply_markup: { inline_keyboard: buttons }
      });

      bot.once("callback_query", async (query2) => {
        const [_, board, exam] = query2.data.split(":");
        await api.answerCallbackQuery(query2.id);

        // Step 3: Select Year
        const years = Array.from({ length: 8 }, (_, i) => 2025 - i);
        const yearButtons = years.map(y => [{ text: `${y}`, callback_data: `year:${y}:${board}:${exam}` }]);

        const yearMsg = await api.sendMessage(chatId, "📅 Select Year:", {
          reply_markup: { inline_keyboard: yearButtons }
        });

        bot.once("callback_query", async (query3) => {
          const [__, year, board, exam] = query3.data.split(":");
          await api.answerCallbackQuery(query3.id);

          // Step 4: Ask Roll
          const rollMsg = await api.sendMessage(chatId, "🆔 Enter your Roll number:");
          global.ownersv2.replies.set(rollMsg.message_id, {
            step: "roll",
            exam, board, year
          });
        });
      });
    });
  },

  onReply: async ({ bot, msg, data, api }) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (data.step === "roll") {
      if (!/^\d+$/.test(text)) {
        return bot.sendMessage(chatId, "❌ Roll number must be digits only.");
      }

      const roll = text;
      const regMsg = await bot.sendMessage(chatId, "🔢 Enter your Registration number:");
      global.ownersv2.replies.set(regMsg.message_id, {
        step: "reg",
        exam: data.exam,
        board: data.board,
        year: data.year,
        roll
      });
    }

    if (data.step === "reg") {
      if (!/^\d+$/.test(text)) {
        return bot.sendMessage(chatId, "❌ Registration number must be digits only.");
      }

      const reg = text;
      const { exam, board, year, roll } = data;

      const url = `https://shaon-ssc-result.vercel.app/result?exam=${exam}&board=${board}&year=${year}&roll=${roll}&reg=${reg}`;
      const loading = await bot.sendMessage(chatId, "⏳ Fetching result...");

      try {
        const res = await axios.get(url);
        if (res.data.status !== "success") {
          return bot.sendMessage(chatId, "❌ Result not found. Please check your input.");
        }

        const s = res.data.student;
        const g = res.data.grades.filter(x => x.subject);
        const grades = g.map(
          sub => `📘 ${sub.subject} ➝ 🎯 Grade: ${sub.grade}`
        ).join("\n");

        const resultText = `
🎓 *SSC Result*
━━━━━━━━━━━━━━━
👤 Name: *${s.Name}*
👨‍👩‍👧‍👦 Father: *${s["Fathers Name"]}*
👩 Mother: *${s["Mothers Name"]}*
🏫 Institute: *${s.Institute}*
📚 Group: *${s.Group}*
📋 Type: *${s.Type}*
🆔 Roll: *${s["Roll No"]}*
🎯 Result: *${s.Result}*
━━━━━━━━━━━━━━━
📖 Subject Grades:
${grades}
        `.trim();

        await bot.sendMessage(chatId, resultText, { parse_mode: "Markdown" });
      } catch (e) {
        await bot.sendMessage(chatId, "❌ API Error: " + e.message);
      }
    }
  }
};
