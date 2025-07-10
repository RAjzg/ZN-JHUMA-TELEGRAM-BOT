const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "1.0.0",
  author: "Shaon Ahmed",
  role: 0,
  description: "Check SSC/HSC/JSC Result",
  commandCategory: "utility",
  usages: "/result",
  cooldowns: 5,
};

module.exports.run = async ({ message, event }) => {
  try {
    const res = await axios.get("https://shaon-ssc-result.vercel.app/options");
    const exams = res.data.examinations;

    if (!exams || exams.length === 0) return message.reply("❌ No exam found!");

    let text = "📚 Select Exam:\n";
    exams.forEach((e, i) => {
      text += `${i + 1}. ${e.name}\n`;
    });

    const info = await message.reply(text);

    global.functions.onReply.set(info.message_id, {
      commandName: module.exports.config.name,
      type: "exam",
      author: event.senderID || event.from.id,
      exams,
    });
  } catch {
    message.reply("❌ Failed to fetch exam list.");
  }
};

module.exports.onReply = async function ({ message, event, Reply }) {
  const { type, exams, boards, exam, board, year, roll } = Reply;
  const input = event.body?.trim();

  try {
    switch (type) {
      case "exam": {
        const index = parseInt(input) - 1;
        if (isNaN(index) || index < 0 || index >= exams.length)
          return message.reply("❌ Invalid exam number.");

        const selectedExam = exams[index].value;
        const res = await axios.get("https://shaon-ssc-result.vercel.app/options");
        const boardList = res.data.boards;

        let msg = "🏫 Select Board:\n";
        boardList.forEach((b, i) => {
          msg += `${i + 1}. ${b.name}\n`;
        });

        const info = await message.reply(msg);
        global.functions.onReply.set(info.message_id, {
          commandName: "result",
          type: "board",
          author: event.senderID || event.from.id,
          exam: selectedExam,
          boards: boardList,
        });
        break;
      }

      case "board": {
        const index = parseInt(input) - 1;
        if (isNaN(index) || index < 0 || index >= boards.length)
          return message.reply("❌ Invalid board number.");

        const selectedBoard = boards[index].value;
        const info = await message.reply("📅 Enter Exam Year (e.g. 2024):");

        global.functions.onReply.set(info.message_id, {
          commandName: "result",
          type: "year",
          author: event.senderID || event.from.id,
          exam,
          board: selectedBoard,
        });
        break;
      }

      case "year": {
        if (!/^20\d{2}$/.test(input)) return message.reply("❌ Invalid year format (e.g. 2024).");

        const info = await message.reply("🧾 Enter Roll Number:");
        global.functions.onReply.set(info.message_id, {
          commandName: "result",
          type: "roll",
          author: event.senderID || event.from.id,
          exam,
          board,
          year: input,
        });
        break;
      }

      case "roll": {
        if (!/^\d{3,10}$/.test(input)) return message.reply("❌ Invalid roll number.");

        const info = await message.reply("📝 Enter Registration Number:");
        global.functions.onReply.set(info.message_id, {
          commandName: "result",
          type: "reg",
          author: event.senderID || event.from.id,
          exam,
          board,
          year,
          roll: input,
        });
        break;
      }

      case "reg": {
        if (!/^\d{3,15}$/.test(input)) return message.reply("❌ Invalid registration number.");

        message.reply("⏳ Fetching result...");

        const url = `https://shaon-ssc-result.vercel.app/result?exam=${exam}&board=${board}&year=${year}&roll=${roll}&reg=${input}`;

        try {
          const res = await axios.get(url);
          const data = res.data;

          if (!data.student) return message.reply("❌ No result found for given info.");

          let replyText = "🎓 𝗦𝘁𝘂𝗱𝗲𝗻𝘁 𝗜𝗻𝗳𝗼:\n";
          for (const [k, v] of Object.entries(data.student)) {
            replyText += `${k}: ${v}\n`;
          }

          replyText += "\n📖 𝗚𝗿𝗮𝗱𝗲 𝗦𝗵𝗲𝗲𝘁:\n";
          data.grades.forEach((g) => {
            if (g.subject && g.code && g.grade) {
              replyText += `${g.subject} (${g.code}): ${g.grade}\n`;
            }
          });

          return message.reply(replyText);
        } catch {
          return message.reply("❌ Error while fetching result.");
        }
      }
    }
  } catch (e) {
    console.log(e);
    return message.reply("❌ Something went wrong.");
  }
};
