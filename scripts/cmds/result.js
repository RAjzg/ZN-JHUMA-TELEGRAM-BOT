const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "2.0.0",
  credits: "Shaon Ahmed",
  role: 0,
  description: "Check SSC/Dakhil results with inline buttons",
  commandCategory: "education",
  usages: "/result",
  cooldowns: 5,
};

module.exports.run = async ({ message, api }) => {
  try {
    const { data } = await axios.get("https://shaon-ssc-result.vercel.app/options");

    if (!data.exam || data.exam.length === 0) {
      return message.reply("❌ Could not fetch exam list.");
    }

    const buttons = data.exam.map((exam, i) => ({
      type: "button",
      text: `${i + 1}. ${exam}`,
      callback_data: `select_exam_${i}`,
    }));

    const msg = await message.reply("📚 Select Exam:", {
      reply_markup: {
        inline_keyboard: [buttons],
      },
    });

    global.functions.reply.set(msg.message_id, {
      type: "exam",
      commandName: module.exports.config.name,
      exams: data.exam,
      author: message.senderID,
    });

  } catch (err) {
    console.error(err);
    return message.reply("❌ Error fetching exam data.");
  }
};

module.exports.reply = async ({ message, event, Reply }) => {
  const userInput = message.body?.trim();

  try {
    if (Reply.type === "exam") {
      const index = parseInt(userInput.replace(/\D/g, ""));
      const exam = Reply.exams[index];

      if (!exam) return message.reply("❌ Invalid exam selected.");

      const { data } = await axios.get(`https://shaon-ssc-result.vercel.app/options?exam=${encodeURIComponent(exam)}`);
      const boards = data.board;

      const buttons = boards.map((b, i) => ({
        type: "button",
        text: `${i + 1}. ${b}`,
        callback_data: `select_board_${i}`,
      }));

      const msg = await message.reply(`🏛️ Select Board for ${exam}:`, {
        reply_markup: {
          inline_keyboard: [buttons],
        },
      });

      global.functions.reply.set(msg.message_id, {
        type: "board",
        commandName: module.exports.config.name,
        exam,
        boards,
        author: message.senderID,
      });
    }

    else if (Reply.type === "board") {
      const index = parseInt(userInput.replace(/\D/g, ""));
      const board = Reply.boards[index];

      if (!board) return message.reply("❌ Invalid board selected.");

      const msg = await message.reply(`✍️ Send your info:\n\nFormat: roll,regno,year\nExample: 123456,987654,2024`);

      global.functions.reply.set(msg.message_id, {
        type: "details",
        commandName: module.exports.config.name,
        exam: Reply.exam,
        board,
        author: message.senderID,
      });
    }

    else if (Reply.type === "details") {
      const [roll, regno, year] = userInput.split(",");

      if (!roll || !regno || !year) {
        return message.reply("❌ Format error! Use: `roll,regno,year`");
      }

      const resultUrl = `https://shaon-ssc-result.vercel.app/result?exam=${encodeURIComponent(Reply.exam)}&board=${encodeURIComponent(Reply.board)}&roll=${roll}&regno=${regno}&year=${year}`;
      const { data } = await axios.get(resultUrl);

      if (data.code !== 200) {
        return message.reply("❌ Result not found.");
      }

      let text = `🎓 Result for ${data.exam} ${year}\n`;
      text += `👤 Name: ${data.name}\n`;
      text += `🏛️ Board: ${data.board}\n`;
      text += `📝 Roll: ${data.roll} | Reg: ${data.regno}\n`;
      text += `📊 GPA: ${data.gpa} (${data.grade})\n\n📘 Subjects:\n`;

      for (const subject of data.subjects) {
        if (subject.subject)
          text += `🔸 ${subject.subject} (${subject.code}) ➜ ${subject.grade}\n`;
      }

      return message.reply(text);
    }

  } catch (err) {
    console.error(err);
    return message.reply("❌ Unexpected error occurred.");
  }
};
