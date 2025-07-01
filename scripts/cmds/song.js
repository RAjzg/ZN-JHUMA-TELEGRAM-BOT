const axios = require("axios");
const fs = require('fs')

module.exports.config = {
    name: "song",
    version: "2.1.0",
    aliases: [],
    author: "dipto",
    countDown: 5,
    role: 0,
    description: "Download audio from YouTube",
    category: "media",
    guide: "{pn} [<song name>|<song link>]:"+ "\n   Example:"+"\n{pn} chipi chipi chapa chapa"
  }
 module.exports.run = async ({api,args, event,commandName, message }) =>{
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    let videoID;
    const urlYtb = checkurl.test(args[0]);

if (urlYtb) {
  const match = args[0].match(checkurl);
  videoID = match ? match[1] : null;
        const { data: { title, download_url } } = await axios.get(
          `https://ytdl.up.railway.app/ytmp3?url=${videoID}`
        );
    return  message.stream({
      url: download_url,caption: title,
    })
}
    let keyWord = args.join(" ");
    keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;
    const maxResults = 6;
    let result;
    try {
      result = ((await axios.get(`https://ytdl.up.railway.app/youtube?q=${keyWord}`)).data).slice(0, results);
    } catch (err) {
      return message.reply("❌ An error occurred:"+err.message);
    }
    if (result.length == 0)
      return message.reply("⭕ No search results match the keyword:"+ keyWord);
    let msg = "";
    let i = 1;
    const thumbnails = [];
    for (const info of result) {
thumbnails.push(info.thumbnail);
      msg += `${i++}. ${info.title}\nTime: ${info.duration}\nChannel: ${info.channel.name}\n\n`;
    }

    //url: await Promise.all(thumbnails),
  const info = await message.reply(msg+ "Reply to this message with a number want to listen")
    const ii = info.message_id
    
global.functions.reply.set(ii, {
        commandName: 'song',
        messageID: ii,
        result
      });
  }
  module.exports.reply = async ({ event, api, Reply ,message}) => {
    try {
    const { result } = Reply;
    const choice = parseInt(event.text);
    if (!isNaN(choice) && choice <= result.length && choice > 0) {
      const infoChoice = result[choice - 1];
      const idvideo = infoChoice.id;
  const { data: { title, download_url ,quality} } = await axios.get(`https://ytdl.up.railway.app/ytmp3?url=${idvideo}`);
    await message.unsend(Reply.messageID)
        await  message.stream({
         url: await dipto(download_url,'audio.mp3'),
        caption: `• Title: ${title}\n• Quality: ${quality}`
        })
      fs.unlinkSync('audio.mp3')
    } else {
      message.reply("Invalid choice. Please enter a number between 1 and 6.");
    }
    } catch (error) {
      console.log(error);
      message.reply("⭕ Sorry, audio size was less than 26MB")
    }   
 };

async function dipto(url,pathName) {
  try {
    const response = (await axios.get(url,{
      responseType: "arraybuffer"
    })).data;

    fs.writeFileSync(pathName, Buffer.from(response));
    return fs.createReadStream(pathName);
  }
  catch (err) {
    throw err;
  }
}
async function diptoSt(url,pathName) {
  try {
    const response = await axios.get(url,{
      responseType: "stream"
    });
    response.data.path = pathName;
    return response.data;
  }
  catch (err) {
    throw err;
  }
}
