const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "1.0.2",
  author: "Shaon Ahmed",
  role: 0,
  description: "Check SSC Result",
  commandCategory: "utility",
  cooldowns: 3
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
  { name: "Technical", value: "tec" }
];

module.exports.onStart = async function ({ message, event, api }) {
  const examText = "📘 Select Exam:\n1. SSC/Dakhil/Equivalent";
  const msg = await message.reply(examText);

  global.functions.onReply.set(msg.messageID, {
    command: module.exports.config.name,
    step: 1
  });
};

module.exports.onReply = async function ({ message, event, Reply }) {
  const text = event.body.trim();
  const { step, board, year, roll } = Reply;

  if (step === 1) {
    const boardList = boards.map((b, i) => `${i + 1}. 🏛️ ${b.name}`).join("\n");
    const msg = await message.reply(`🏛️ Select Board:\n${boardList}`);
    global.functions.onReply.set(msg.messageID, {
      command: module.exports.config.name,
      step: 2
    });
  }

  if (step === 2) {
    const index = parseInt(text) - 1;
    if (isNaN(index) || index < 0 || index >= boards.length) {
      return message.reply("❌ Invalid board number.");
    }

    const selectedBoard = boards[index].value;
    const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
    const yearList = years.map((y, i) => `${i + 1}. 📅 ${y}`).join("\n");
    const msg = await message.reply(`📆 Select Year:\n${yearList}`);

    global.functions.onReply.set(msg.messageID, {
      command: module.exports.config.name,
      step: 3,
      board: selectedBoard
    });
  }

  if (step === 3) {
    const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
    const index = parseInt(text) - 1;
    if (isNaN(index) || index < 0 || index >= years.length) {
      return message.reply("❌ Invalid year.");
    }

    const selectedYear = years[index];
    const msg = await message.reply("🔢 Enter Roll Number:");

    global.functions.onReply.set(msg.messageID, {
      command: module.exports.config.name,
      step: 4,
      board,
      year: selectedYear
    });
  }

  if (step === 4) {
    if (!/^\d+$/.test(text)) return message.reply("❌ Roll must be numeric.");

    const msg = await message.reply("📝 Enter Registration Number:");
    global.functions.onReply.set(msg.messageID, {
      command: module.exports.config.name,
      step: 5,
      board,
      year,
      roll: text
    });
  }

  if (step === 5) {
    if (!/^\d+$/.test(text)) return message.reply("❌ Registration must be numeric.");

    const reg = text;
    const url = `https://shaon-ssc-result.vercel.app/result?exam=ssc&board=${board}&year=${year}&roll=${roll}&reg=${reg}`;

    try {
      const res = await axios.get(url);
      if (res.data.status !== "success")
        return message.reply("❌ Result not found.");

      const s = res.data.student;
      const grades = res.data.grades
        .filter(x => x.subject)
        .map(x => `📚 ${x.subject}: ${x.grade}`)
        .join("\n");

      const result = `
🎓 SSC Result ${year}
━━━━━━━━━━━━━━━
👤 Name: ${s.Name}
👨‍👩‍👧‍👦 Father: ${s["Fathers Name"]}
👩 Mother: ${s["Mothers Name"]}
🏫 Institute: ${s.Institute}
📚 Group: ${s.Group}
🏛️ Board: ${s.Board}
🆔 Roll: ${s["Roll No"]}
📆 DOB: ${s["Date of Birth"]}
📋 Type: ${s.Type}
🎯 Result: ${s.Result}

📘 Subject Grades:
${grades}
━━━━━━━━━━━━━━━
`;
      message.reply(result);
    } catch (e) {
      console.error(e.message);
      message.reply("⚠️ Could not fetch result. Try again later.");
    }
  }
};
