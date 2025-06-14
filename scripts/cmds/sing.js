const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "sing",
  version: "2.1.0",
  aliases: ["music", "play"],
  author: "dipto",
  countDown: 5,
  role: 0,
  description: "Download audio from YouTube",
  category: "media",
  guide: "{pn} [<song name>|<song link>]\nExample: {pn} chipi chipi chapa chapa"
};

module.exports.run = async ({ api, args, event, message }) => {
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  let videoID;
  const urlYtb = checkurl.test(args[0]);

  if (urlYtb) {
    const match = args[0].match(checkurl);
    videoID = match ? match[1] : null;

    try {
      const { data: { title, url } } = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=${videoID}`);
      const stream = await downloadAudio(url, "audio.mp3");

      const stats = fs.statSync("audio.mp3");
      if (stats.size > 26000000) {
        fs.unlinkSync("audio.mp3");
        return message.reply("⭕ Sorry, audio file is larger than 26MB and cannot be sent.");
      }

      await message.stream({
        url: stream,
        caption: title
      });

      fs.unlinkSync("audio.mp3");
    } catch (err) {
      console.error(err);
      return message.reply("⭕ Sorry, audio size was more than allowed or an error occurred.");
    }

    return;
  }

  const query = args.join(" ");
  try {
    const { data: results } = await axios.get(`https://noobs-api-sable.vercel.app/ytsearch?query=${encodeURIComponent(query)}`);

    if (!Array.isArray(results) || results.length === 0) {
      return message.reply("⭕ No search results match the keyword: " + query);
    }

    const topResults = results.slice(0, 6);
    let msg = "";
    topResults.forEach((info, index) => {
      msg += `${index + 1}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
    });

    const sent = await message.reply(msg + "Reply to this message with a number to download the audio.");
    global.functions.reply.set(sent.messageID, {
      commandName: "sing",
      messageID: sent.messageID,
      result: topResults
    });
  } catch (err) {
    console.error(err);
    return message.reply("❌ সার্চ করতে সমস্যা হয়েছে: " + err.message);
  }
};

module.exports.reply = async ({ event, Reply, message }) => {
  try {
    const { result } = Reply;
    const choice = parseInt(event.text);
    if (!isNaN(choice) && choice >= 1 && choice <= result.length) {
      const video = result[choice - 1];
      const videoID = video.id;

      const { data: { title, url } } = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=${videoID}`);
      const stream = await downloadAudio(url, "audio.mp3");

      const stats = fs.statSync("audio.mp3");
      if (stats.size > 26000000) {
        fs.unlinkSync("audio.mp3");
        return message.reply("⭕ Sorry, audio file is larger than 26MB and cannot be sent.");
      }

      await message.stream({
        url: stream,
        caption: `• Title: ${title}`
      });

      fs.unlinkSync("audio.mp3");
    } else {
      message.reply("❌ Invalid choice. Please enter a number between 1 and " + result.length);
    }
  } catch (error) {
    console.error(error);
    return message.reply("⭕ Sorry, audio size was more than allowed or an error occurred.");
  }
};

async function downloadAudio(url, pathName) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer"
    });
    fs.writeFileSync(pathName, Buffer.from(response.data));
    return fs.createReadStream(pathName);
  } catch (err) {
    throw err;
  }
}
