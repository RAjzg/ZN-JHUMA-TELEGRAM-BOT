const axios = require('axios');

module.exports = {
  config: {
    name: "up",
    version: "1.0.3",
    role: 0,
    credits: "Shaon Ahmed",
    description: "Uptime monitor (create, delete, status, list)",
    category: "system",
    usages: "/up [name] [url] | /up delete [id/name/index] | /up status [id/name] | /up list",
    cooldowns: 5,
  },

  onStart: async ({ message, args }) => {
    const apiLink = "https://web-api-delta.vercel.app/upt";

    if (!args.length) {
      return message.reply(
        `📍 Usage:\n\n` +
        `✅ Create: /up [name] [url]\n` +
        `🗑️ Delete: /up delete [id|name|number]\n` +
        `📊 Status: /up status [id|name]\n` +
        `📜 List: /up list\n\n` +
        `Example:\n` +
        `/up Shaon https://example.com\n` +
        `/up delete 123456\n` +
        `/up delete Shaon\n` +
        `/up delete 3\n` +
        `/up status Shaon\n` +
        `/up list`
      );
    }

    const command = args[0].toLowerCase();

    // ✅ Delete Command (id, name, or list index)
    if (command === "delete") {
      const target = args[1];
      if (!target)
        return message.reply("❌ Please provide monitor ID, name, or list number.\nUsage: /up delete <id|name|number>");

      try {
        let deleteIdOrName = target;

        // If it's a number, treat as list index
        if (!isNaN(target)) {
          const listRes = await axios.get(`${apiLink}?list=true`);
          const monitors = listRes.data.monitors;
          const index = parseInt(target) - 1;

          if (!monitors || !monitors[index])
            return message.reply("❌ Invalid number. No monitor found at that position in list.");

          deleteIdOrName = monitors[index].id;
        }

        const res = await axios.get(`${apiLink}?delete=true&${isNaN(deleteIdOrName) ? `name=${encodeURIComponent(deleteIdOrName)}` : `id=${deleteIdOrName}`}`);
        const result = res.data;

        return message.reply(result.success ? result.message : `❌ Error:\n${result.message}`);
      } catch (e) {
        return message.reply(`🚫 API Error: ${e.message}`);
      }
    }

    // ✅ Status Command (id or name)
    if (command === "status") {
      const target = args[1];
      if (!target)
        return message.reply("❌ Please provide monitor ID or name.\nUsage: /up status <id|name>");

      try {
        const res = await axios.get(`${apiLink}?status=true&${isNaN(target) ? `name=${encodeURIComponent(target)}` : `id=${target}`}`);
        const result = res.data;

        if (result.success) {
          const data = result.data;
          return message.reply(
            `📊 Monitor Status:\n` +
            `🆔 ID: ${data.id}\n` +
            `📛 Name: ${data.name}\n` +
            `🔗 URL: ${data.url}\n` +
            `⏰ Interval: ${data.interval} minutes\n` +
            `📶 Status: ${data.status == 2 ? "🟢 Up" : data.status == 9 ? "🔴 Down" : "⚪️ Paused"}`
          );
        } else {
          return message.reply(`❌ Error:\n${result.message}`);
        }
      } catch (e) {
        return message.reply(`🚫 API Error: ${e.message}`);
      }
    }

    // ✅ List Command
    if (command === "list") {
      try {
        const res = await axios.get(`${apiLink}?list=true`);
        const result = res.data;

        if (result.success) {
          const list = result.monitors;
          if (list.length === 0) {
            return message.reply(`❌ No monitor found.`);
          }

          const msg = list.map(
            (item, index) =>
              `${index + 1}. 🌐 ${item.name}\n` +
              `🔗 ${item.url}\n` +
              `🆔 ID: ${item.id}\n` +
              `📶 Status: ${item.status == 2 ? "🟢 Up" : item.status == 9 ? "🔴 Down" : "⚪️ Paused"}\n`
          ).join("\n");

          return message.reply(`📜 Monitor List:\n\n${msg}`);
        } else {
          return message.reply(`❌ Error:\n${result.message}`);
        }
      } catch (e) {
        return message.reply(`🚫 API Error: ${e.message}`);
      }
    }

    // ✅ Create Command
    const name = args[0];
    const url = args[1];

    if (!url || !url.startsWith("http")) {
      return message.reply("❌ Please provide name and valid URL.\nUsage: /up [name] [url]");
    }

    try {
      const res = await axios.get(`${apiLink}?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`);
      const result = res.data;

      if (result.success) {
        const data = result.data;
        return message.reply(
          `✅ Monitor Created!\n──────────────\n` +
          `🆔 ID: ${data.id}\n` +
          `📛 Name: ${data.name}\n` +
          `🔗 URL: ${data.url}\n` +
          `⏰ Interval: ${data.interval} minutes\n` +
          `📶 Status: ${data.status == 2 ? "🟢 Up" : data.status == 9 ? "🔴 Down" : "⚪️ Paused"}`
        );
      } else {
        return message.reply(`❌ Error:\n${result.message}`);
      }
    } catch (e) {
      return message.reply(`🚫 API Error: ${e.message}`);
    }
  },
};
