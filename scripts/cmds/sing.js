const axios = require("axios");
const fs = require('fs');

module.exports.config = {
  name: "sing",
  version: "2.1.0",
  aliases: ["music", "play"],
  author: "dipto",
  countDown: 5,
  role: 0,
  description: "Download audio from YouTube",
  category: "media",
  guide: "{pn} [<song name>|<song link>]:\n   Example:\n{pn} chipi chipi chapa chapa"
};

module.exports.run = async ({ api, args, event, commandName, message }) => {
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  let videoID;
  const urlYtb = checkurl.test(args[0]);

  if (urlYtb) {
    const match = args[0].match(checkurl);
    videoID = match ? match[1] : null;

    const { data: { title, url } } = await axios.get(
      `https://noobs-api-sable.vercel.app/ytdl?url=${videoID}`
    );

    return message.stream({
      url: await downloadAudio(url, 'audio.mp3'),
      caption: title
    });
  }

  let keyWord = args.join(" ");
  keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;
  const maxResults = 6;
  let result;

  try {
    result = (await axios.get(`https://noobs-api-sable.vercel.app/ytsearch?query=${keyWord}`)).data.slice(0, maxResults);
  } catch (err) {
    return message.reply("❌ An error occurred: " + err.message);
  }

  if (result.length == 0)
    return message.reply("⭕ No search results match the keyword: " + keyWord);

  let msg = "";
  let i = 1;
  for (const info of result) {
    msg += `${i++}. ${info.title}\n⏱️ Time: ${info.time}\n📺 Channel: ${info.channel.name}\n\n`;
  }

  const info = await message.reply(msg + "📩 Reply to this message with a number to get audio");
  const replyID = info.messageID;

  global.functions.reply.set(replyID, {
    commandName: 'sing',
    messageID: replyID,
    result
  });
};

module.exports.reply = async ({ event, api, Reply, message }) => {
  try {
    const { result } = Reply;
    const choice = parseInt(event.text);

    if (!isNaN(choice) && choice <= result.length && choice > 0) {
      const infoChoice = result[choice - 1];
      const idvideo = infoChoice.id;

      const { data: { title, url, quality } } = await axios.get(`https://noobs-api-sable.vercel.app/ytdl?url=${idvideo}`);
      await message.unsend(Reply.messageID);

      await message.stream({
        url: await downloadAudio(url, 'audio.mp3'),
        caption: `🎵 Title: ${title}\n🎧 Quality: ${quality}`
      });

      fs.unlinkSync('audio.mp3');
    } else {
      message.reply("❌ Invalid choice. Please enter a number between 1 and 6.");
    }
  } catch (error) {
    console.error(error);
    message.reply("⭕ Sorry, audio size was likely too large or an error occurred.");
  }
};

async function downloadAudio(url, pathName) {
  try {
    const response = (await axios.get(url, {
      responseType: "arraybuffer"
    })).data;

    fs.writeFileSync(pathName, Buffer.from(response));
    return fs.createReadStream(pathName);
  } catch (err) {
    throw err;
  }
}
