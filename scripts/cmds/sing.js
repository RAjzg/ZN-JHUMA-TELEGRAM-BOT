const axios = require("axios");
const fs = require('fs');

module.exports.config = {
  name: "sing",
  version: "2.1.1",
  aliases: ["music", "play"],
  author: "dipto",
  countDown: 5,
  role: 0,
  description: "Download audio from YouTube using ytmp3 API",
  category: "media",
  guide: "{pn} [<song name>|<song link>]:" + "\nExample:\n{pn} chipi chipi chapa chapa"
};

module.exports.run = async ({ api, args, event, commandName, message }) => {
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  let videoID;
  const urlYtb = checkurl.test(args[0]);

  if (urlYtb) {
    const match = args[0].match(checkurl);
    videoID = match ? match[1] : null;

    try {
      // এখানে ytmp3 API ইউজ করলাম
      const { data } = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=https://www.youtube.com/watch?v=${videoID}`);

      if (!data.url) {
        return message.reply("❌ ডাউনলোড লিংক পাওয়া যায়নি।");
      }

      return message.stream({
        url: data.url,
        caption: `🎵 Title: ${data.title || "Unknown"}`
      });
    } catch (err) {
      console.error(err);
      return message.reply("❌ অডিও ডাউনলোডে সমস্যা হয়েছে।");
    }
  } else {
    // সার্চ লজিক, আগের মতোই রেখে দিচ্ছি
    let keyWord = args.join(" ");
    keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;
    const maxResults = 6;
    let result;
    try {
      result = (await axios.get(`https://noobs-api-sable.vercel.app/ytsearch?query=${encodeURIComponent(keyWord)}`)).data.slice(0, maxResults);
    } catch (err) {
      return message.reply("❌ সার্চ করতে সমস্যা হয়েছে: " + err.message);
    }
    if (result.length == 0)
      return message.reply("⭕ কোনো ভিডিও পাওয়া যায়নি: " + keyWord);

    let msg = "";
    let i = 1;
    for (const info of result) {
      msg += `${i++}. ${info.title}\nChannel: ${info.channel}\nDuration: ${info.time}\n\n`;
    }

    const info = await message.reply(msg + "Reply to this message with the number to listen.");

    global.functions.reply.set(info.messageID, {
      commandName: 'sing',
      messageID: info.messageID,
      result
    });
  }
};

module.exports.reply = async ({ event, api, Reply, message }) => {
  try {
    const { result } = Reply;
    const choice = parseInt(event.text);
    if (!isNaN(choice) && choice <= result.length && choice > 0) {
      const infoChoice = result[choice - 1];
      const idvideo = infoChoice.id;

      const { data } = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=https://www.youtube.com/watch?v=${idvideo}`);

      if (!data.url) {
        return message.reply("❌ ডাউনলোড লিংক পাওয়া যায়নি।");
      }

      await message.unsend(Reply.messageID);

      await message.stream({
        url: data.url,
        caption: `🎵 Title: ${data.title || "Unknown"}`
      });
    } else {
      message.reply("❌ ভুল ইনপুট! 1 থেকে " + result.length + " এর মধ্যে একটি সংখ্যা লেখো।");
    }
  } catch (error) {
    console.log(error);
    message.reply("⭕ অডিও ডাউনলোডে সমস্যা হয়েছে।");
  }
};
