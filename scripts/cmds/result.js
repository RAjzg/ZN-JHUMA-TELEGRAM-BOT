const axios = require("axios");

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

const sessions = new Map();

module.exports = {
  config: {
    name: "result",
    version: "1.0.2",
    role: 0,
    author: "Shaon Ahmed",
    description: "SSC/HSC Result Checker with UI",
    category: "Education",
    countDown: 3,
  },

  onStart: async function ({ api, event, bot }) {
    const chatId = event.chat?.id || event.threadID;

    const examMarkup = {
      reply_markup: {
        inline_keyboard: [[{ text: "📘 SSC", callback_data: "exam_ssc" }]],
      },
    };

    const sent = await api.sendMessage(chatId, "📘 Select Exam Type:", examMarkup);
    sessions.set(chatId, { step: "exam", messageId: sent.message_id });

    bot.once("callback_query", async (query) => {
      const session = sessions.get(chatId);
      if (!session || query.message.message_id !== session.messageId) return;

      if (query.data === "exam_ssc") {
        session.exam = "ssc";

        const boardButtons = boards.map((b) => [{ text: b.name, callback_data: `board_${b.value}` }]);

        await api.editMessageText(chatId, session.messageId, "🏛️ Select Board:", {
          reply_markup: { inline_keyboard: boardButtons },
        });

        bot.once("callback_query", async (bQuery) => {
          const boardValue = bQuery.data.replace("board_", "");
          session.board = boardValue;

          const years = Array.from({ length: 25 }, (_, i) => 2000 + i).reverse();
          const yearButtons = years.map((y) => [{ text: `${y}`, callback_data: `year_${y}` }]);

          await api.editMessageText(chatId, session.messageId, "📆 Select Year:", {
            reply_markup: { inline_keyboard: yearButtons },
          });

          bot.once("callback_query", async (yQuery) => {
            const year = yQuery.data.replace("year_", "");
            session.year = year;

            await api.sendMessage(chatId, "🔢 Send Roll Number:");
            sessions.set(chatId, { ...session, step: "awaiting_roll" });
          });
        });
      }
    });
  },

  onReply: async function ({ bot, msg }) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const session = sessions.get(chatId);

    if (!session) return;

    if (session.step === "awaiting_roll") {
      session.roll = text;
      session.step = "awaiting_reg";
      sessions.set(chatId, session);
      return bot.sendMessage(chatId, "📝 Now send Registration Number:");
    }

    if (session.step === "awaiting_reg") {
      session.reg = text;

      const { exam, board, year, roll, reg } = session;
      const url = `https://shaon-ssc-result.vercel.app/result?exam=${exam}&board=${board}&year=${year}&roll=${roll}&reg=${reg}`;

      try {
        const res = await axios.get(url);
        const data = res.data;

        if (data.status !== "success") return bot.sendMessage(chatId, "❌ Result not found.");

        const s = data.student;
        const grades = data.grades.map(g => `📘 ${g.subject}: *${g.grade}*`).join("\n");

        const resultText = `🎓 *SSC Result*
━━━━━━━━━━━━━━
👤 Name: \`${s.Name}\`
👨‍👩‍👧‍👦 Father: \`${s["Fathers Name"]}\`
👩 Mother: \`${s["Mothers Name"]}\`
🏫 Institute: \`${s.Institute}\`
📚 Group: \`${s.Group}\`
🏛️ Board: \`${s.Board}\`
🆔 Roll: \`${s["Roll No"]}\`
📅 DOB: \`${s["Date of Birth"]}\`
🎯 Result: *${s.Result}*
━━━━━━━━━━━━━━
${grades}`;

        await bot.sendMessage(chatId, resultText, { parse_mode: "Markdown" });
        sessions.delete(chatId);
      } catch (e) {
        return bot.sendMessage(chatId, "❌ Error fetching result.");
      }
    }
  },
};
