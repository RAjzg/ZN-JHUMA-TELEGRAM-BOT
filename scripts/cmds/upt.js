const axios = require('axios');

module.exports.config = {
  name: "upt",
  version: "1.0.2",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "BetterStack uptime monitor: create, delete, status, list",
  category: "uptime",
  usages: "upt [url] | upt delete [id] | upt status [id] | upt list",
  cooldowns: 30,
};

module.exports.onStart = async ({ message, args }) => {
  try {
    const apiLink = "https://noobs-api-sable.vercel.app/upt"; // 🟩 এখানে তোমার API URL বসাও

    if (!args.length) {
      return message.reply(
        `📍 কমান্ড:\n\n` +
        `✅ Create: upt [url]\n` +
        `🗑️ Delete: upt delete [id]\n` +
        `📊 Status: upt status [id]\n` +
        `📜 List: upt list\n\n` +
        `Example:\n` +
        `upt https://example.com\n` +
        `upt delete 123456\n` +
        `upt status 123456\n` +
        `upt list`
      );
    }

    const command = args[0].toLowerCase();

    // 🗑️ Delete Command
    if (command === "delete") {
      const id = args[1];
      if (!id) return message.reply("❌ দয়া করে ID দিন।\nUsage: upt delete <id>");

      const res = await axios.get(`${apiLink}?delete&id=${encodeURIComponent(id)}`);
      if (res.data.success) {
        return message.reply(`🗑️ ${res.data.message}`);
      } else {
        return message.reply(`❌ Error:\n${JSON.stringify(res.data)}`);
      }
    }

    // 📊 Status Command
    if (command === "status") {
      const id = args[1];
      if (!id) return message.reply("❌ দয়া করে ID দিন।\nUsage: upt status <id>");

      const res = await axios.get(`${apiLink}?status&id=${encodeURIComponent(id)}`);
      const data = res.data.data;

      if (res.data.success) {
        return message.reply(
          `📊 Monitor Status:\n` +
          `🆔 ID: ${data.id}\n` +
          `🌐 Name: ${data.name}\n` +
          `🔗 URL: ${data.url}\n` +
          `⏰ Interval: ${data.interval} seconds\n` +
          `📶 Status: ${data.status}`
        );
      } else {
        return message.reply(`❌ Error:\n${JSON.stringify(res.data)}`);
      }
    }

    // 📜 List Command
    if (command === "list") {
      const res = await axios.get(`${apiLink}?list=true`);
      const list = res.data.monitors;

      if (!list.length) {
        return message.reply("❌ কোনো মনিটর পাওয়া যায়নি।");
      }

      const output = list
        .map(
          (item, index) =>
            `${index + 1}. 🌐 ${item.name}\n` +
            `🔗 ${item.url}\n` +
            `🆔 ID: ${item.id}\n` +
            `📶 Status: ${item.status}\n`
        )
        .join("\n\n");

      return message.reply(`📜 All Monitors:\n\n${output}`);
    }

    // ✅ Create Command
    const url = args.join(" ").trim();
    if (!url.startsWith("http")) {
      return message.reply("❌ দয়া করে একটি সঠিক URL দিন।\nUsage: upt <url>");
    }

    const res = await axios.get(`${apiLink}?url=${encodeURIComponent(url)}`);
    const data = res.data.data;

    if (res.data.success) {
      return message.reply(
        `✅ Monitor Created Successfully!\n` +
        `🆔 ID: ${data.id}\n` +
        `🌐 Name: ${data.name}\n` +
        `🔗 URL: ${data.url}\n` +
        `⏰ Interval: ${data.interval} seconds\n` +
        `📶 Status: ${data.status}`
      );
    } else {
      return message.reply(`❌ Error:\n${JSON.stringify(res.data)}`);
    }

  } catch (e) {
    console.log(e);
    return message.reply(`❌ Error: ${e.message}`);
  }
};
