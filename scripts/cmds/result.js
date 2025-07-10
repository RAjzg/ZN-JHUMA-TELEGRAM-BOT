const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "1.0.3",
  author: "Shaon Ahmed",
  role: 0,
  description: "Check SSC result with reply",
  commandCategory: "utility",
  usages: "/result",
  cooldowns: 3,
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
  { name: "Technical", value: "tec" },
];

module.exports.run = async ({ api, event }) => {
  const msg = await api.sendMessage(
    "📘 Select Exam:\n1. SSC/Dakhil/Equivalent",
    event.threadID,
    (err, info) => {
      global.functions.onReply.set(info.messageID, {
        commandName: this.config.name,
        step: 1,
        author: event.from.id,
      });
    }
  );
};

module.exports.onReply = async ({ api, event, Reply }) => {
  const input = event.body.trim();
  const { step, board, year, roll } = Reply;

  if (event.senderID !== Reply.author)
    return api.sendMessage("⛔ Only the command author can reply.", event.threadID);

  if (step === 1) {
    const list = boards.map((b, i) => `${i + 1}. 🏛️ ${b.name}`).join("\n");
    return api.sendMessage(`🏛️ Select Board:\n${list}`, event.threadID, (err, info) => {
      global.functions.onReply.set(info.messageID, {
        commandName: this.config.name,
        step: 2,
        author: event.from.id,
      });
    });
  }

  if (step === 2) {
    const index = parseInt(input) - 1;
    if (isNaN(index) || index < 0 || index >= boards.length)
      return api.sendMessage("❌ Invalid board number.", event.threadID);

    const selectedBoard = boards[index].value;
    const yearList = Array.from({ length: 27 }, (_, i) => `${i + 1}. 📅 ${2000 + i}`).join("\n");
    return api.sendMessage(`📆 Select Year:\n${yearList}`, event.threadID, (err, info) => {
      global.functions.onReply.set(info.messageID, {
        commandName: this.config.name,
        step: 3,
        author: event.from.id,
        board: selectedBoard,
      });
    });
  }

  if (step === 3) {
    const index = parseInt(input) - 1;
    const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
    if (isNaN(index) || index < 0 || index >= years.length)
      return api.sendMessage("❌ Invalid year.", event.threadID);

    const selectedYear = years[index];
    return api.sendMessage("🔢 Enter your Roll Number:", event.threadID, (err, info) => {
      global.functions.onReply.set(info.messageID, {
        commandName: this.config.name,
        step: 4,
        author: event.from.id,
        board,
        year: selectedYear,
      });
    });
  }

  if (step === 4) {
    if (!/^\d+$/.test(input))
      return api.sendMessage("❌ Roll must be a number.", event.threadID);

    return api.sendMessage("📄 Enter Registration Number:", event.threadID, (err, info) => {
      global.functions.onReply.set(info.messageID, {
        commandName: this.config.name,
        step: 5,
        author: event.from.id,
        board,
        year,
        roll: input,
      });
    });
  }

  if (step === 5) {
    if (!/^\d+$/.test(input))
      return api.sendMessage("❌ Registration must be a number.", event.threadID);

    const url = `https://shaon-ssc-result.vercel.app/result?exam=ssc&board=${board}&year=${year}&roll=${roll}&reg=${input}`;

    try {
      const res = await axios.get(url);
      if (res.data.status !== "success")
        return api.sendMessage("❌ Result not found.", event.threadID);

      const s = res.data.student;
      const grades = res.data.grades
        .filter(x => x.subject)
        .map(x => `📚 ${x.subject}: ${x.grade}`)
        .join("\n");

      const resultText = `
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

      return api.sendMessage(resultText, event.threadID);
    } catch (e) {
      return api.sendMessage("⚠️ API error. Try again later.", event.threadID);
    }
  }
};
