module.exports = {
  config: {
    name: "age",
    version: "1.0.0",
    role: 0,
    credits: "Shaon Ahmed",
    description: "দিন, মাস, বছর থেকে বয়স বের করুন",
    category: "utility",
    usages: "/age [দিন] [মাস] [বছর]",
    cooldowns: 3,
  },

  run: async function ({ bot, msg }) {
    const chatId = msg.chat.id;
    const args = msg.text.split(" ").slice(1);

    if (args.length !== 3) {
      return bot.sendMessage(
        chatId,
        "❌ ব্যবহার: /age দিন মাস বছর\nউদাহরণ: /age 14 07 2005"
      );
    }

    const [day, month, year] = args.map(Number);

    if (
      isNaN(day) || isNaN(month) || isNaN(year) ||
      day < 1 || day > 31 ||
      month < 1 || month > 12 ||
      year < 1900 || year > new Date().getFullYear()
    ) {
      return bot.sendMessage(chatId, "❌ সঠিক দিন, মাস এবং বছর দিন।");
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

    const text = `🗓 জন্ম তারিখ: ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}\n📌 আপনার বয়স: ${years} বছর, ${months} মাস, ${days} দিন`;

    return bot.sendMessage(chatId, text);
  }
};
