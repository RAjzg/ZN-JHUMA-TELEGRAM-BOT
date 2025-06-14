const axios = require("axios");
const fs = require('fs');

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json`
  );
  return base.data.alldl;
};

module.exports.config = {
  name: "sing",
  version: "2.1.0",
  aliases: ["music", "play"],
  author: "dipto",
  countDown: 5,
  role: 0,
  description: "Download audio from YouTube",
  category: "media",
  guide:
    "{pn} [<song name>|<song link>]:" +
    "\n   Example:" +
    "\n{pn} chipi chipi chapa chapa",
};

module.exports.run = async ({ api, args, event, commandName, message }) => {
  const checkurl =
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  let videoID;
  const urlYtb = checkurl.test(args[0]);

  if (urlYtb) {
    const match = args[0].match(checkurl);
    videoID = match ? match[1] : null;

    const { data: { title, url } } = await axios.get(
      `${await baseApiUrl()}/ytmp3?url=${videoID}`
    );

    return message.stream({
      url: await dipto(url, 'audio.mp3'),
      caption: `• Title: ${title}`,
    });
  }

  let keyWord = args.join(" ");
  keyWord = keyWord.includes("?feature=share")
    ? keyWord.replace("?feature=share", "")
    : keyWord;
  const maxResults = 6;
  let result;
  try {
    result = (
      await axios.get(`${await baseApiUrl()}/ytsearch?query=${keyWord}`)
    ).data.results.slice(0, maxResults);
  } catch (err) {
    return message.reply("❌ An error occurred:" + err.message);
  }
  if (result.length == 0)
    return message.reply("⭕ No search results match the keyword:" + keyWord);

  let msg = "";
  let i = 1;

  for (const info of result) {
    msg += `${i++}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel}\n\n`;
  }

  const info = await message.reply(
    msg + "Reply to this message with a number want to listen"
  );
  const ii = info.message_id;

  global.functions.reply.set(ii, {
    commandName: "sing",
    messageID: ii,
    result,
  });
};

module.exports.reply = async ({ event, api, Reply, message }) => {
  try {
    const { result } = Reply;
    const choice = parseInt(event.text);
    if (!isNaN(choice) && choice <= result.length && choice > 0) {
      const infoChoice = result[choice - 1];
      const idvideo = infoChoice.id;

      const { data: { title, url } } = await axios.get(
        `${await baseApiUrl()}/ytmp3?url=${idvideo}`
      );

      await message.unsend(Reply.messageID);

      await message.stream({
        url: await dipto(url, "audio.mp3"),
        caption: `• Title: ${title}`,
      });

      fs.unlinkSync("audio.mp3");
    } else {
      message.reply("Invalid choice. Please enter a number between 1 and 6.");
    }
  } catch (error) {
    console.log(error);
    message.reply("⭕ Sorry, audio size was more than allowed or an error occurred.");
  }
};

async function dipto(url, pathName) {
  try {
    const response = (
      await axios.get(url, {
        responseType: "arraybuffer",
      })
    ).data;

    fs.writeFileSync(pathName, Buffer.from(response));
    return fs.createReadStream(pathName);
  } catch (err) {
    throw err;
  }
}
