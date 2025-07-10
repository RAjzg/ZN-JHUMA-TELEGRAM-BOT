const axios = require("axios");

module.exports = {
  config: {
    name: "result",
    version: "1.0.0",
    author: "Shaon Ahmed",
    role: 0,
    description: "Check SSC/HSC/JSC Result",
    commandCategory: "utility",
    usages: "/result",
    cooldowns: 5,
  },

  run: async ({ bot, msg }) => {
    // 🔒 Block if user tries to run /result by replying to a message
    if (msg.reply_to_message) return;

    try {
      const res = await axios.get("https://shaon-ssc-result.vercel.app/options");
      const exams = res.data?.examinations;

      if (!exams || exams.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ Could not fetch exam list. Please try again later.");
      }

      let text = "📚 Select Exam:\n";
      exams.forEach((e, i) => {
        text += `${i + 1}. ${e.name}\n`;
      });

      const sent = await bot.sendMessage(msg.chat.id, text, {
        reply_markup: { force_reply: true },
      });

      global.client = global.client || {};
      global.client.onReply = global.client.onReply || [];

      global.client.onReply.push({
        name: this.config.name,
        messageID: sent.message_id,
        author: msg.from.id,
        step: "exam",
        exams,
      });
    } catch (e) {
      console.error("[result] Error fetching exams:", e.message);
      bot.sendMessage(msg.chat.id, "❌ Failed to fetch exam list.");
    }
  },

  onReply: async ({ bot, msg }) => {
    const data = global.client?.onReply?.find(
      (item) => item.messageID === msg.reply_to_message?.message_id && item.author === msg.from.id
    );

    if (!data) return;

    const { step, exams, boards, exam, board, year, roll } = data;
    const input = msg.text.trim();
    const chatId = msg.chat.id;

    try {
      switch (step) {
        case "exam": {
          const i = parseInt(input) - 1;
          if (isNaN(i) || i < 0 || i >= exams.length)
            return bot.sendMessage(chatId, "❌ Invalid exam number.");

          const selectedExam = exams[i].value;
          const res = await axios.get("https://shaon-ssc-result.vercel.app/options");
          const boardList = res.data?.boards;

          if (!boardList || boardList.length === 0)
            return bot.sendMessage(chatId, "❌ Could not fetch board list.");

          let text = "🏫 Select Board:\n";
          boardList.forEach((b, i) => {
            text += `${i + 1}. ${b.name}\n`;
          });

          const sent = await bot.sendMessage(chatId, text, {
            reply_markup: { force_reply: true },
          });

          global.client.onReply.push({
            name: "result",
            messageID: sent.message_id,
            author: msg.from.id,
            step: "board",
            exam: selectedExam,
            boards: boardList,
          });
          break;
        }

        case "board": {
          const i = parseInt(input) - 1;
          if (isNaN(i) || i < 0 || i >= boards.length)
            return bot.sendMessage(chatId, "❌ Invalid board number.");

          const selectedBoard = boards[i].value;
          const sent = await bot.sendMessage(chatId, "📅 Enter Exam Year (e.g. 2024):", {
            reply_markup: { force_reply: true },
          });

          global.client.onReply.push({
            name: "result",
            messageID: sent.message_id,
            author: msg.from.id,
            step: "year",
            exam,
            board: selectedBoard,
          });
          break;
        }

        case "year": {
          if (!/^20\d{2}$/.test(input))
            return bot.sendMessage(chatId, "❌ Invalid year format (e.g. 2024).");

          const sent = await bot.sendMessage(chatId, "🧾 Enter Roll Number:", {
            reply_markup: { force_reply: true },
          });

          global.client.onReply.push({
            name: "result",
            messageID: sent.message_id,
            author: msg.from.id,
            step: "roll",
            exam,
            board,
            year: input,
          });
          break;
        }

        case "roll": {
          if (!/^\d{3,10}$/.test(input))
            return bot.sendMessage(chatId, "❌ Invalid roll number.");

          const sent = await bot.sendMessage(chatId, "📝 Enter Registration Number:", {
            reply_markup: { force_reply: true },
          });

          global.client.onReply.push({
            name: "result",
            messageID: sent.message_id,
            author: msg.from.id,
            step: "reg",
            exam,
            board,
            year,
            roll: input,
          });
          break;
        }

        case "reg": {
          if (!/^\d{3,15}$/.test(input))
            return bot.sendMessage(chatId, "❌ Invalid registration number.");

          bot.sendMessage(chatId, "⏳ Fetching result...");

          const url = `https://shaon-ssc-result.vercel.app/result?exam=${exam}&board=${board}&year=${year}&roll=${roll}&reg=${input}`;

          try {
            const res = await axios.get(url);
            const data = res.data;

            if (!data.student)
              return bot.sendMessage(chatId, "❌ No result found for the given information.");

            let text = "🎓 𝗦𝘁𝘂𝗱𝗲𝗻𝘁 𝗜𝗻𝗳𝗼:\n";
            for (const [k, v] of Object.entries(data.student)) {
              text += `${k}: ${v}\n`;
            }

            text += "\n📖 𝗚𝗿𝗮𝗱𝗲 𝗦𝗵𝗲𝗲𝘁:\n";
            data.grades.forEach((g) => {
              text += `${g.subject} (${g.code}): ${g.grade}\n`;
            });

            return bot.sendMessage(chatId, text);
          } catch (err) {
            console.error("[result] Fetch error:", err.message);
            return bot.sendMessage(chatId, "❌ Error while fetching result.");
          }
        }
      }
    } catch (err) {
      console.error("[result] Runtime error:", err.message);
      bot.sendMessage(chatId, "❌ Something went wrong.");
    }
  },
};
