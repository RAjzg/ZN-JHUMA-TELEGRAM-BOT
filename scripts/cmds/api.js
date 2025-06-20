const axios = require("axios");

module.exports.config = {
  name: "api",
  version: "1.0",
  role: 0,
  author: "Shaon",
  description: "Fetch API JSON response from any URL",
  category: "𝗧𝗢𝗢𝗟𝗦",
  guide: {
    en: "/api [url]"
  }
};

module.exports.onStart = async function ({ api, event, args }) {
  const url = args[0];
  if (!url) {
    return api.sendMessage("❌ Give an API URL to fetch.\nExample: /xapi https://example.com/api", event.threadID, event.messageID);
  }

  try {
    const res = await axios.get(url);
    const json = res.data;

    // Format JSON prettily
    const message = `✅ API Response from:\n${url}\n━━━━━━━━━━━━━━\n` + "```json\n" + JSON.stringify(json, null, 2).substring(0, 3800) + "\n```";

    return api.sendMessage(message, event.threadID, event.messageID);
  } catch (e) {
    return api.sendMessage(`❌ Error fetching API:\n${e.message}`, event.threadID, event.messageID);
  }
};
