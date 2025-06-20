const axios = require("axios");

module.exports = {
  config: {
    name: "api",
    version: "1.0",
    aliases: [],
    author: "Shaon",
    role: 0,
    description: "Fetch JSON response from any API URL",
    category: "𝗧𝗢𝗢𝗟𝗦",
    guide: {
      en: "/api <url>"
    }
  },

  onStart: async function ({ message, args }) {
    const url = args[0];
    if (!url) {
      return message.reply("❌ Please provide an API URL.\nExample: /xapi https://example.com/api");
    }

    try {
      const res = await axios.get(url);
      const json = res.data;

      let response = JSON.stringify(json, null, 2);

      // Telegram limit: 4096 characters max, safe limit ~3900
      if (response.length > 3900) {
        response = response.substring(0, 3900) + "\n...";
      }

      return message.reply(`✅ API Response from:\n${url}\n\n\`\`\`json\n${response}\n\`\`\``);
    } catch (e) {
      return message.reply(`❌ Error fetching API:\n${e.message}`);
    }
  }
};
