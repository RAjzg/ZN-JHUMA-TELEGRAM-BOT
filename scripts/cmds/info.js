const moment = require('moment-timezone');

module.exports = {
    config: {
        name: "info",
        version: "1.0",
        countDown: 20,
        role: 0,
        author: "dipto",
        description: "Owner information",
        category: "owner",
        guide: "{p}"
    },
  onStart: async ({ api, message ,event }) => {
        try {
            const botName = "SHAON PROJECT";
            const botPrefix = "/";
            const authorName = "SHAON AHMED";
            const ownAge = "18";
            const teamName = "Noobs team";
      const authorFB = "https://m.me/Hey.Its.Me.Shaon.Ahmed";
          const authorInsta = "https://www.instagram.com/hey.its.me.shaon.ahmed";
  const link = "https://i.imgur.com/qMe4oK0.jpg";
        const now = moment().tz('Asia/Dhaka');
      const date = now.format('MMMM Do YYYY');
          const time = now.format('h:mm:ss A');
            const uptime = process.uptime();
      const seconds = Math.floor(uptime % 60);
const minutes = Math.floor((uptime / 60) % 60);
const hours = Math.floor((uptime / (60 * 60)) % 24);
const days = Math.floor(uptime / (60 * 60 * 24));
const uptimeString = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
            const buttons = {
                inline_keyboard: [
                    [
        { text: "Facebook", url: authorFB },
  { text: "Instagram", url: `${authorInsta}` }
                    ]
                ]
            };

            const caption = `
• Bot & Owner Info
╰‣ Bot Name: ${botName}
╰‣ Bot Prefix: ${botPrefix}
╰‣ Owner: ${authorName}
╰‣ Age: ${ownAge}
╰‣ Facebook: ${authorFB}
╰‣ Instagram: ${authorInsta}
╰‣ Date: ${date}
╰‣ Time: ${time}
╰‣ Team: ${teamName}
╰‣ Uptime: ${uptimeString}`;

            const hh = await api.sendPhoto(event.chat.id ,link, {caption: caption, reply_markup: buttons });
            setTimeout(() => {
             message.unsend(hh.message_id);
            }, 40000);
        } catch (error) {
            console.error("Error reading config file:", error);
        }
    },
    onChat: async function ({ event, message }) {
        if (event.body?.toLowerCase() === "info" || event.body?.toLowerCase() === "owner") {
            this.onStart({ message });
        }
    }
};
