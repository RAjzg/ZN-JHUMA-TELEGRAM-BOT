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

module.exports.run = async ({ message }) => {
  try {
    const res = await axios.get("https://shaon-ssc-result.vercel.app/options");
    const exams = res.data.examinations;

    if (!exams || exams.length === 0) return message.reply("❌ No exams found.");

    let text = "📚 Select Exam:\n";
    exams.forEach((e, i) => {
      text += `${i + 1}. ${e.name}\n`;
    });

    const info = await message.reply(text);

    global.functions.reply.set(info.message_id, {
      commandName: module.exports.config.name,
      type: "exam",
      author: message.senderID,
      exams,
    });
  } catch (e) {
    console.log(e);
    message.reply("❌ Failed to fetch exam list.");
  }
};

module.exports.reply = async ({ message, event, Reply }) => {
  const input = message.body.trim();
  const { type, exams, boards, exam, board, year, roll } = Reply;

  const replyID = event.messageReply.message_id;
  const sender = message.senderID;

  try {
    switch (type) {
      case "exam": {
        const i = parseInt(input) - 1;
        if (isNaN(i) || i < 0 || i >= exams.length) return message.reply("❌ Invalid exam number.");

        const selectedExam = exams[i].value;
        const res = await axios.get("https://shaon-ssc-result.vercel.app/options");
        const boardList = res.data.boards;

        let text = "🏫 Select Board:\n";
        boardList.forEach((b, i) => {
          text += `${i + 1}. ${b.name}\n`;
        });

        const info = await message.reply(text);

        global.functions.reply.set(info.message_id, {
          commandName: module.exports.config.name,
          type: "board",
          author: sender,
          exam: selectedExam,
          boards: boardList,
        });
        break;
      }

      case "board": {
        const i = parseInt(input) - 1;
        if (isNaN(i) || i < 0 || i >= boards.length) return message.reply("❌ Invalid board number.");

        const selectedBoard = boards[i].value;

        const info = await message.reply("📅 Enter Exam Year (e.g. 2024):");

        global.functions.reply.set(info.message_id, {
          commandName: module.exports.config.name,
          type: "year",
          author: sender,
          exam,
          board: selectedBoard,
        });
        break;
      }

      case "year": {
        if (!/^20\d{2}$/.test(input)) return message.reply("❌ Invalid year (e.g. 2024)");

        const info = await message.reply("🧾 Enter Roll Number:");

        global.functions.reply.set(info.message_id, {
          commandName: module.exports.config.name,
          type: "roll",
          author: sender,
          exam,
          board,
          year: input,
        });
        break;
      }

      case "roll": {
        if (!/^\d{3,10}$/.test(input)) return message.reply("❌ Invalid roll number.");

        const info = await message.reply("📝 Enter Registration Number:");

        global.functions.reply.set(info.message_id, {
          commandName: module.exports.config.name,
          type: "reg",
          author: sender,
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

          if (!data.student) return message.reply("❌ Result not found.");

          let text = `🎓 𝗦𝘁𝘂𝗱𝗲𝗻𝘁 𝗜𝗻𝗳𝗼:\n`;
          for (const [k, v] of Object.entries(data.student)) {
            text += `${k}: ${v}\n`;
          }

          text += "\n📖 𝗚𝗿𝗮𝗱𝗲 𝗦𝗵𝗲𝗲𝘁:\n";
          data.grades.forEach((g) => {
            if (g.subject && g.code) {
              text += `${g.subject} (${g.code}): ${g.grade}\n`;
            }
          });

          return message.reply(text);
        } catch (err) {
          console.error(err);
          return message.reply("❌ Error fetching result.");
        }
      }
    }
  } catch (err) {
    console.log(err);
    return message.reply("❌ Something went wrong.");
  }
};
