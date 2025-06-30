const axios = require('axios');

module.exports.config = {
  name: "upt",
  version: "1.0.0",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Manage BetterStack uptime monitors: create, delete, status",
  category: "uptime",
  usages: "upt create <url> | upt delete <id> | upt status <id> | upt <url> (alias create)",
  cooldowns: 30,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  try {
    if (!args.length) {
      return message.reply(
        `📌 Usage:\n` +
        `- upt create <url>\n` +
        `- upt delete <monitor_id>\n` +
        `- upt status <monitor_id>\n` +
        `- upt <url> (alias for create)`
      );
    }

    const API_BASE = "https://noobs-api-sable.vercel.app";

    // If first arg is "create", remove it, treat rest as URL
    let action = args[0].toLowerCase();
    if (action === "create") {
      args.shift();
      action = "create";
    }

    if (action === "delete") {
      const id = args[1];
      if (!id) return message.reply("❌ Please provide monitor ID to delete.\nExample: upt delete 123456");

      const response = await axios.get(`${API_BASE}/upt/delete?id=${encodeURIComponent(id)}`);

      if (response.data.success) {
        return message.reply(`✅ Monitor with ID ${id} deleted successfully.`);
      } else {
        return message.reply(`❌ Failed to delete monitor.\nDetails: ${JSON.stringify(response.data)}`);
      }

    } else if (action === "status") {
      const id = args[1];
      if (!id) return message.reply("❌ Please provide monitor ID to check status.\nExample: upt status 123456");

      const response = await axios.get(`${API_BASE}/upt/status?id=${encodeURIComponent(id)}`);

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        return message.reply(
          `🆔 Monitor ID: ${data.id}\n` +
          `🌐 Name: ${data.name}\n` +
          `🔗 URL: ${data.url}\n` +
          `⏰ Interval: ${data.interval} seconds\n` +
          `📊 Status: ${data.status}\n` +
          `🔗 Dashboard: https://uptime.betterstack.com/dashboard/${data.id}`
        );
      } else {
        return message.reply(`❌ Failed to fetch status.\nDetails: ${JSON.stringify(response.data)}`);
      }

    } else {
      // Treat as create monitor with arg as URL (default)
      const url = args.join(" ").trim();
      if (!url) return message.reply("❌ Please provide a URL.\nUsage: upt <url>");

      const response = await axios.get(`${API_BASE}/upt?url=${encodeURIComponent(url)}`);

      if (response.data.error) {
        return message.reply(`❌ Error: ${response.data.error}`);
      }

      const data = response.data.data;

      return message.reply(
        `✅ Monitor Created Successfully!\n\n` +
        `🆔 ID: ${data.id}\n` +
        `🌐 Name: ${data.name}\n` +
        `🔗 URL: ${data.url}\n` +
        `⏰ Interval: ${data.interval} seconds\n` +
        `📊 Status: ${data.status}\n` +
        `🔗 Dashboard: https://uptime.betterstack.com/dashboard/${data.id}`
      );
    }

  } catch (e) {
    console.log(e);
    return message.reply(`❌ An error occurred: ${e.message}`);
  }
};
