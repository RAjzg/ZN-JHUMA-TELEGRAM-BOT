module.exports = {
  config: {
    name: "age",
    version: "1.0.0",
    role: 0, // 0 = সবার জন্য, 1 = গ্রুপ এডমিন, 2 = বট এডমিন
    credits: "Shaon Ahmed",
    description: "দিন, মাস, বছর থেকে বয়স বের করুন",
    category: "utility",
    usages: "/age [দিন] [মাস] [বছর]",
    cooldowns: 3,
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length !== 3) {
      return api.sendMessage(
        "❌ ব্যবহার: /age দিন মাস বছর\nউদাহরণ: /age 14 07 2005",
        threadID,
        messageID
      );
    }

    const [day, month, year] = args.map(Number);

    if (
      isNaN(day) || isNaN(month) || isNaN(year) ||
      day < 1 || day > 31 ||
      month < 1 || month > 12 ||
      year < 1900 || year > new Date().getFullYear()
    ) {
      return api.sendMessage("❌ সঠিক দিন, মাস এবং বছর দিন।", threadID, messageID);
    }

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return api.sendMessage(
      `🗓 জন্ম তারিখ: ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}\n📌 আপনার বয়স: ${years} বছর, ${months} মাস, ${days} দিন`,
      threadID,
      messageID
    );
  }
};
