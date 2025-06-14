const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "sing",
  version: "1.0.0",
  aliases: ["music", "play"],
  author: "Shaon Ahmed",
  countDown: 5,
  role: 0,
  description: "Download audio from YouTube",
  category: "media",
  guide: "{pn} [song name or YouTube link]"
};

module.exports.run = async ({ api, args, event, commandName, message }) => {
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const isUrl = checkurl.test(args[0]);
  let videoID;

  if (isUrl) {
    const match = args[0].match(checkurl);
    videoID = match ? match[1] : null;
    const res = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=${videoID}`);
    return message.stream({
      url: await streamAudio(res.data.url, "audio.mp3"),
      caption: res.data.title
    });
  }

  const keyword = args.join(" ");
  let results;
  try {
    const response = await axios.get(`https://noobs-api-sable.vercel.app/ytsearch?query=${encodeURIComponent(keyword)}`);
    results = response.data.results;
  } catch (err) {
    return message.reply(`❌ সার্চ করতে সমস্যা হয়েছে: ${err.message}`);
  }

  if (!Array.isArray(results) || results.length === 0)
    return message.reply(`⭕ No search results match the keyword: ${keyword}`);

  let msg = "";
  results.slice(0, 6).forEach((info, index) => {
    msg += `${index + 1}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel}\n\n`;
  });

  const replyMsg = await message.reply(msg + "Reply to this message with a number to download the audio.");
  global.functions.reply.set(replyMsg.message_id, {
    commandName: "sing",
    messageID: replyMsg.message_id,
    results
  });
};

module.exports.reply = async ({ event, api, Reply, message }) => {
  try {
    const { results } = Reply;
    const choice = parseInt(event.text);
    if (isNaN(choice) || choice < 1 || choice > results.length)
      return message.reply("Invalid choice. Please enter a number between 1 and 6.");

    const info = results[choice - 1];
    const videoID = new URL(info.url).searchParams.get("v");
    const res = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=${videoID}`);

    await message.unsend(Reply.messageID);
    await message.stream({
      url: await streamAudio(res.data.url, "audio.mp3"),
      caption: res.data.title
    });

    fs.unlinkSync("audio.mp3");
  } catch (error) {
    console.error(error);
    message.reply("⭕ Sorry, audio size was more than allowed or an error occurred.");
  }
};

async function streamAudio(url, filename) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(filename, Buffer.from(response.data));
  return fs.createReadStream(filename);
}
