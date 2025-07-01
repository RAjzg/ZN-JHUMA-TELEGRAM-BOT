const axios = require('axios');

module.exports.config = {
  name: "upt",
  version: "1.0.0",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "BetterStack uptime monitor: create, delete, status",
  category: "uptime",
  usages: "upt [url] | upt delete [id] | upt status [id]",
  cooldowns: 30,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  try {
    if (!args.length) {
      return message.reply(
        `📍 ব্যবহার:\n` +
        `- upt [url] → Create Monitor\n` +
        `- upt delete [id] → Delete Monitor\n` +
        `- upt status [id] → Monitor Status\n\n` +
        `Example:\n` +
        `upt https://example.com\n` +
        `upt delete 123456\n` +
        `upt status 123456`
      );
    }

    const apiLink = "https://noobs-api-sable.vercel.app/upt"; // তোমার API URL

    const command = args[0].toLowerCase();

    // 🗑️ Delete
    if (command === "delete") {
      const id = args[1];
      if (!id) return message.reply("❌ দয়া করে ID দিন।\nUsage: upt delete <id>");

      const res = await axios.get(`${apiLink}?delete&id=${encodeURIComponent(id)}`);
      if (res.data.message) {
        return message.reply(`🗑️ ${res.data.message}`);
      } else {
        return message.reply(`❌ Error:\n${JSON.stringify(res.data)}`);
      }
    }

    // 📊 Status
    if (command === "status") {
      const id = args[1];
      if (!id) return message.reply("❌ দয়া করে ID দিন।\nUsage: upt status <id>");

      const res = await axios.get(`${apiLink}?status&id=${encodeURIComponent(id)}`);
      const data = res.data.data;

      if (data) {
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

    // ✅ Create
    const url = args.join(" ").trim();
    if (!url.startsWith("http")) {
      return message.reply("❌ দয়া করে একটি সঠিক URL দিন।\nUsage: upt <url>");
    }

    const res = await axios.get(`${apiLink}?url=${encodeURIComponent(url)}`);
    const data = res.data.data;

    if (data) {
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
