const axios = require('axios');

module.exports = {
  config: {
    name: "up", // 🔥 কমান্ডের নাম এখন "up"
    version: "1.0.2",
    role: 0,
    credits: "Shaon Ahmed",
    description: "Uptime monitor (create, delete, status, list)",
    category: "system",
    usages: "/up [name] [url] | /up delete [id] | /up status [id] | /up list",
    cooldowns: 5,
  },

  onStart: async ({ message, args }) => {
    const apiLink = "https://web-api-delta.vercel.app/upt"; // 🔥 এখানে তোমার API URL বসাও

    if (!args.length) {
      return message.reply(
        `📍 Usage:\n\n` +
          `✅ Create: /up [name] [url]\n` +
          `🗑️ Delete: /up delete [id]\n` +
          `📊 Status: /up status [id]\n` +
          `📜 List: /up list\n\n` +
          `Example:\n` +
          `/up Shaon https://example.com\n` +
          `/up delete 123456\n` +
          `/up status 123456\n` +
          `/up list`
      );
    }

    const command = args[0].toLowerCase();

    // ✅ Delete Command
    if (command === "delete") {
      const id = args[1];
      if (!id)
        return message.reply("❌ Please provide the monitor ID.\nUsage: /up delete <id>");

      try {
        const res = await axios.get(`${apiLink}?delete=true&id=${id}`);
        const result = res.data;
        if (result.success) {
          return message.reply(result.message);
        } else {
          return message.reply(`❌ Error:\n${result.message}`);
        }
      } catch (e) {
        return message.reply(`🚫 API Error: ${e.message}`);
      }
    }

    // ✅ Status Command
    if (command === "status") {
      const id = args[1];
      if (!id)
        return message.reply("❌ Please provide the monitor ID.\nUsage: /up status <id>");

      try {
        const res = await axios.get(`${apiLink}?status=true&id=${id}`);
        const result = res.data;

        if (result.success) {
          const data = result.data;
          return message.reply(
            `📊 Monitor Status:\n` +
              `🆔 ID: ${data.id}\n` +
              `📛 Name: ${data.name}\n` +
              `🔗 URL: ${data.url}\n` +
              `⏰ Interval: ${data.interval} minutes\n` +
              `📶 Status: ${
                data.status == 2
                  ? "🟢 Up"
                  : data.status == 9
                  ? "🔴 Down"
                  : "⚪️ Paused"
              }`
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

          const msg = list
            .map(
              (item, index) =>
                `${index + 1}. 🌐 ${item.name}\n` +
                `🔗 ${item.url}\n` +
                `🆔 ID: ${item.id}\n` +
                `📶 Status: ${
                  item.status == 2
                    ? "🟢 Up"
                    : item.status == 9
                    ? "🔴 Down"
                    : "⚪️ Paused"
                }\n`
            )
            .join("\n");

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
      return message.reply(
        "❌ Please provide name and valid URL.\nUsage: /up [name] [url]"
      );
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
            `📶 Status: ${
              data.status == 2
                ? "🟢 Up"
                : data.status == 9
                ? "🔴 Down"
                : "⚪️ Paused"
            }`
        );
      } else {
        return message.reply(`❌ Error:\n${result.message}`);
      }
    } catch (e) {
      return message.reply(`🚫 API Error: ${e.message}`);
    }
  },
};
