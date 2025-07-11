const axios = require("axios");

module.exports = {
  config: {
    name: "result",
    version: "1.2.0",
    author: "Shaon Ahmed",
    description: "SSC Result Checker via Inline UI with cleanup",
    category: "Education",
    role: 0,
    countDown: 5,
  },

  onStart: async ({ api, event, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // Step 1: Select Exam
    const msg = await api.sendMessage(chatId, "📘 Select Exam Type:", {
      reply_markup: {
        inline_keyboard: [[{ text: "📘 SSC", callback_data: "exam:ssc" }]]
      }
    });

    bot.once("callback_query", async (query) => {
      const data = query.data.split(":");
      if (data[0] !== "exam") return;

      const exam = data[1];
      await api.answerCallbackQuery(query.id);
      await api.deleteMessage(chatId, msg.message_id);

      // Step 2: Select Board
      const boards = [
        "barisal", "chittagong", "comilla", "dhaka", "dinajpur",
        "jessore", "mymensingh", "rajshahi", "sylhet", "madrasah", "tec"
      ];

      const boardButtons = boards.map(b => [{ text: b.toUpperCase(), callback_data: `board:${b}:${exam}` }]);
      const boardMsg = await api.sendMessage(chatId, "🏛️ Select Board:", {
        reply_markup: { inline_keyboard: boardButtons }
      });

      bot.once("callback_query", async (query2) => {
        const [_, board, exam] = query2.data.split(":");
        await api.answerCallbackQuery(query2.id);
        await api.deleteMessage(chatId, boardMsg.message_id);

        // Step 3: Select Year
        const years = Array.from({ length: 8 }, (_, i) => 2025 - i);
        const yearButtons = years.map(y => [{ text: `${y}`, callback_data: `year:${y}:${board}:${exam}` }]);

        const yearMsg = await api.sendMessage(chatId, "📅 Select Year:", {
          reply_markup: { inline_keyboard: yearButtons }
        });

        bot.once("callback_query", async (query3) => {
          const [__, year, board, exam] = query3.data.split(":");
          await api.answerCallbackQuery(query3.id);
          await api.deleteMessage(chatId, yearMsg.message_id);

          // Step 4: Ask Roll
          const askRoll = await api.sendMessage(chatId, "🔢 Enter your Roll number:");
          global.functions.onReply.set(askRoll.message_id, {
            commandName: "result",
            step: "roll",
            year,
            board,
            exam,
            deleteMsgId: askRoll.message_id
          });
        });
      });
    });
  },

  onReply: async ({ api, bot, event, Reply }) => {
    const chatId = event.chat?.id || event.threadID;
    const msg = event.text?.trim();

    // Delete previous message
    if (Reply.deleteMsgId) {
      try {
        await api.deleteMessage(chatId, Reply.deleteMsgId);
      } catch {}
    }

    if (Reply.step === "roll") {
      if (!/^\d+$/.test(msg)) return api.sendMessage(chatId, "❗ Roll number must be numeric.");

      const askReg = await api.sendMessage(chatId, "🆔 Enter your Registration number:");
      global.functions.onReply.set(askReg.message_id, {
        commandName: "result",
        step: "reg",
        exam: Reply.exam,
        board: Reply.board,
        year: Reply.year,
        roll: msg,
        deleteMsgId: askReg.message_id
      });
    }

    if (Reply.step === "reg") {
      if (!/^\d+$/.test(msg)) return api.sendMessage(chatId, "❗ Registration number must be numeric.");

      const { exam, board, year, roll } = Reply;
      const reg = msg;

      const loading = await api.sendMessage(chatId, "⏳ Fetching result...");

      try {
        const res = await axios.get(`https://shaon-ssc-result.vercel.app/result?exam=${exam}&board=${board}&year=${year}&roll=${roll}&reg=${reg}`);
        if (res.data.status !== "success") {
          await api.deleteMessage(chatId, loading.message_id);
          return api.sendMessage(chatId, "❌ Result not found. Please check your input.");
        }

        const s = res.data.student;
        const g = res.data.grades.filter(x => x.subject);
        const grades = g.map(
          sub => `📘 ${sub.subject} ➝ 🎯 Grade: ${sub.grade}`
        ).join("\n");

        const text = `
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

        await api.deleteMessage(chatId, loading.message_id);
        return api.sendMessage(chatId, text, { parse_mode: "Markdown" });

      } catch (e) {
        await api.deleteMessage(chatId, loading.message_id);
        return api.sendMessage(chatId, `❌ API Error: ${e.message}`);
      }
    }
  }
};
