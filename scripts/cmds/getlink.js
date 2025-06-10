const { get } = require("axios");
const { shorten } = require("tinyurl");
const baseApiUrl = async () => {
  const res = await get(
    "https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
  );
  return res.data.api;
};

module.exports = {
  config: {
    name: "getlink",
    aliases: ["gl", "g"],
    version: "1.0",
    author: "Shaon Ahmed",
    countDown: 2,
    role: 0,
    description:
      "𝗚𝗲𝘁 download URL from video/audio sent in group",
    category: "𝗨𝗧𝗜𝗟𝗜𝗧𝗬",
    guide:
      "{pn} [--t] [reply_attachment]\n{pn} [--i] [reply_attachment]\n{pn} [--tg] [reply_attachment]\n{pn} [reply_attachment]\n{pn} [--p] [reply_attachment]\n{pn} [--dc] reply or add link image\n{pn} [--sl] [reply_attachment]\n{pn} [--imgur] [reply_attachment]"
  },

  onStart: async ({ message, args, event }) => {
    try {
      const { messageReply, type } = event;
      const attachments = messageReply?.attachments || [];
      const length = attachments.length;
      if (length === 0) {
        return message.reply(
          "❌ | 𝚈𝚘𝚞 𝚖𝚞𝚜𝚝 reply to a video, audio, or photo"
        );
      }

      let msg = `✅ | Here are your ${length} link(s):\n\n`;
      let api = await baseApiUrl();

      const doShorten = async (url) => await shorten(url);

      for (let i = 0; i < length; i++) {
        const url = attachments[i].url;
        let link = "";

        const opt = args[0];
        switch (opt) {
          case "--t":
          case "t":
          case "tinyurl":
            link = await doShorten(url);
            break;

          case "--tg":
          case "tg":
          case "telegraph":
            {
              const s = await doShorten(url);
              const res = await get(`${api}/tg?url=${s}`);
              link = res.data.data;
            }
            break;

          case "--i":
          case "i":
          case "imgbb":
            {
              const res = await get(
                `${api}/imgbb?url=${encodeURIComponent(url)}`
              );
              link = res.data.data.url;
            }
            break;

          case "--imgur":
          case "imgur":
          case "imgurl":
            {
              const s = await doShorten(url);
              const res = await get(`${api}/imgur?url=${s}`);
              link = res.data.data;
            }
            break;

          case "--p":
          case "postimg":
          case "postimage":
            {
              const res = await get(
                `${api}/postimg?imageUrl=${encodeURIComponent(url)}`
              );
              link = res.data.directLink;
            }
            break;

          case "--dc":
          case "dc":
          case "discord":
            {
              const res = await get(
                `${api}/dc?imageUrl=${encodeURIComponent(url)}`
              );
              link = res.data.url;
            }
            break;

          case "--sl":
          case "sl":
          case "shortlink":
            {
              const res = await get(
                `${api}/linkshort?link=${encodeURIComponent(
                  url
                )}&name=${encodeURIComponent(attachments[i].filename)}`
              );
              link = res.data.shortLink;
            }
            break;

          default:
            // no args: return direct URL
            link = url;
            break;
        }

        msg += `${i + 1}: ${link}\n`;
      }

      message.reply(msg);
    } catch (err) {
      console.error(err);
      message.reply(`❎ | Error: ${err.message}`);
    }
  }
};
