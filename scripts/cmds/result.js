const axios = require("axios");

module.exports.config = {
  name: "result",
  version: "1.0.0",
  author: "Shaon Ahmed",
  role: 0,
  description: "SSC result checker using inline button",
  commandCategory: "utility",
  cooldowns: 5,
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

const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
const sessions = new Map();

module.exports.run = async ({ api, event }) => {
  const examType = [
    [{ text: "🧪 SSC", callback_data: "exam_ssc" }],
  ];
  api.sendMessage(
    {
      body: "📘 Select Exam Type:",
      attachment: null,
      mentions: [],
      messageID: event.messageID,
    },
    event.threadID,
    (_, info) => {
      global.functions.reply.set(info.messageID, {
        commandName: "result",
        type: "callback",
        step: 1,
        session: {},
        author: event.senderID,
      });
    }
  );
};

module.exports.onReply = async ({ api, event, onReply }) => {
  const { step, session, author } = onReply;

  if (event.senderID != author) return;

  const text = event.body.trim();

  if (step === 1) {
    const boardList = boards.map((b, i) => `${i + 1}. ${b.name}`).join("\n");
    api.sendMessage(`🏛️ Select Board:\n\n${boardList}`, event.threadID, (_, info) => {
      global.functions.reply.set(info.messageID, {
        commandName: "result",
        type: "callback",
        step: 2,
        session,
        author,
      });
    });
  }

  if (step === 2) {
    const index = parseInt(text) - 1;
    if (isNaN(index) || index < 0 || index >= boards.length)
      return api.sendMessage("🚫 Invalid board number.", event.threadID);

    session.board = boards[index].value;

    const yearList = years.map((y, i) => `${i + 1}. ${y}`).join("\n");
    api.sendMessage(`📆 Select Year:\n\n${yearList}`, event.threadID, (_, info) => {
      global.functions.reply.set(info.messageID, {
        commandName: "result",
        type: "callback",
        step: 3,
        session,
        author,
      });
    });
  }

  if (step === 3) {
    const index = parseInt(text) - 1;
    if (isNaN(index) || index < 0 || index >= years.length)
      return api.sendMessage("🚫 Invalid year.", event.threadID);

    session.year = years[index];
    api.sendMessage("🔢 Enter Roll Number:", event.threadID, (_, info) => {
      global.functions.reply.set(info.messageID, {
        commandName: "result",
        type: "callback",
        step: 4,
        session,
        author,
      });
    });
  }

  if (step === 4) {
    if (!/^\d+$/.test(text)) return api.sendMessage("❌ Digits only.", event.threadID);
    session.roll = text;

    api.sendMessage("📄 Enter Registration Number:", event.threadID, (_, info) => {
      global.functions.reply.set(info.messageID, {
        commandName: "result",
        type: "callback",
        step: 5,
        session,
        author,
      });
    });
  }

  if (step === 5) {
    if (!/^\d+$/.test(text)) return api.sendMessage("❌ Digits only.", event.threadID);
    session.reg = text;

    const { board, year, roll, reg } = session;
    const url = `https://shaon-ssc-result.vercel.app/result?exam=ssc&board=${board}&year=${year}&roll=${roll}&reg=${reg}`;

    try {
      const res = await axios.get(url);
      if (res.data.status !== "success")
        return api.sendMessage("❌ Result not found.", event.threadID);

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
🏛️ Board: ${s.Board}
🆔 Roll: ${s["Roll No"]}
📆 DOB: ${s["Date of Birth"]}
📚 Group: ${s.Group}
📋 Type: ${s.Type}
🎯 Result: ${s.Result}

📘 Subject Grades:
${grades}
━━━━━━━━━━━━━━━
`;
      api.sendMessage(result, event.threadID);
    } catch (e) {
      api.sendMessage("⚠️ Could not fetch result.", event.threadID);
    }
  }
};
