const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "1.0.0",
  credits: "Shaon Ahmed",
  role: 0,
  description: "Check SSC/Dakhil results",
  commandCategory: "education",
  usages: "/result",
  cooldowns: 5,
};

module.exports.run = async function ({ message }) {
  try {
    const res = await axios.get("https://shaon-ssc-result.vercel.app/get-exam");
    const examList = res.data.exam;

    if (!examList || examList.length === 0) {
      return message.reply("❌ Failed to fetch exam list.");
    }

    let text = "📚 Select Exam:\n";
    examList.forEach((exam, index) => {
      text += `${index + 1}. ${exam}\n`;
    });

    const info = await message.reply(text);

    global.functions.reply.set(info.message_id, {
      commandName: module.exports.config.name, // ✅ Must match this file name
      type: "exam",
      author: message.senderID,
      exams: examList,
    });
  } catch (err) {
    console.error(err);
    message.reply("❌ An error occurred while fetching exams.");
  }
};

module.exports.reply = async function ({ message, event, Reply }) {
  try {
    const { type, exams } = Reply;

    if (type === "exam") {
      const input = message.body.trim();
      const choice = parseInt(input);

      if (isNaN(choice) || choice < 1 || choice > exams.length) {
        return message.reply("❌ Invalid exam number.");
      }

      const selectedExam = exams[choice - 1];

      // Fetch board list based on selected exam
      const boardRes = await axios.get(`https://shaon-ssc-result.vercel.app/get-board?exam=${encodeURIComponent(selectedExam)}`);
      const boards = boardRes.data.board;

      if (!boards || boards.length === 0) {
        return message.reply("❌ Failed to fetch board list.");
      }

      let text = `🏛️ Select Board for: ${selectedExam}\n`;
      boards.forEach((b, i) => {
        text += `${i + 1}. 🏛️ ${b}\n`;
      });

      const info = await message.reply(text);

      global.functions.reply.set(info.message_id, {
        commandName: module.exports.config.name, // ✅ Must match
        type: "board",
        author: message.senderID,
        boards,
        exam: selectedExam,
      });
    }

    else if (type === "board") {
      const input = message.body.trim();
      const choice = parseInt(input);

      if (isNaN(choice) || choice < 1 || choice > Reply.boards.length) {
        return message.reply("❌ Invalid board number.");
      }

      const selectedBoard = Reply.boards[choice - 1];

      // Now ask for roll, reg, year
      const text = `✍️ Send your result info like this:\n\n📝 roll,reg,year\n\nExample:\n123456,987654,2024`;

      const info = await message.reply(text);

      global.functions.reply.set(info.message_id, {
        commandName: module.exports.config.name,
        type: "details",
        author: message.senderID,
        exam: Reply.exam,
        board: selectedBoard,
      });
    }

    else if (type === "details") {
      const input = message.body.trim();
      const [roll, reg, year] = input.split(",");

      if (!roll || !reg || !year) {
        return message.reply("❌ Invalid format. Use:\n123456,987654,2024");
      }

      const resultUrl = `https://shaon-ssc-result.vercel.app/api?exam=${encodeURIComponent(Reply.exam)}&board=${encodeURIComponent(Reply.board)}&roll=${roll}&regno=${reg}&year=${year}`;
      const response = await axios.get(resultUrl);

      const data = response.data;

      if (data.code !== 200) {
        return message.reply("❌ Result not found or invalid input.");
      }

      let resultMsg = `📄 Result for ${data.exam} ${year}\n`;
      resultMsg += `👤 Name: ${data.name}\n`;
      resultMsg += `🎓 Roll: ${data.roll} | Reg: ${data.regno}\n`;
      resultMsg += `🏛️ Board: ${data.board}\n`;
      resultMsg += `📚 GPA: ${data.gpa} (${data.grade})\n\n`;
      resultMsg += `📘 Subjects:\n`;

      data.subjects.forEach((subject) => {
        if (subject.subject) {
          resultMsg += `🔸 ${subject.subject} (${subject.code}) ➜ ${subject.grade}\n`;
        }
      });

      return message.reply(resultMsg);
    }

  } catch (err) {
    console.error(err);
    return message.reply("❌ Something went wrong while processing your reply.");
  }
};
