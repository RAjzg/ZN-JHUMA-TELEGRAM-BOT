const axios = require('axios');

module.exports.config = {
  name: "add",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat",//Nazrul
  usePrefix: true,
  description: "random love story video",
  category: "video",
  usages: "random",
  cooldowns: 30,
};

module.exports.onStart = async ({ api, event, args, message }) => {
  try {
    const fileId =
      event?.reply_to_message?.photo?.slice(-1)[0]?.file_id ||
      event?.reply_to_message?.video?.file_id;
    const imageUrl = await api.getFileLink(fileId);
    const videoName = args.join(" ").trim(); 

    if (!videoName) {
      return message.reply("Please provide a name for the video.");
    }
    const apis1 = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const Shaon1 = apis1.data.noobs
    

    const imgurResponse = await axios.get(`${Shaon1}/imgur?url=${encodeURIComponent(imageUrl)}`);
    const imgurLink = imgurResponse.data.link
    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const Shaon = apis.data.api;

    const response = await axios.get(`${Shaon}/video/random?name=${encodeURIComponent(videoName)}&url=${encodeURIComponent(imgurLink)}`);
    
    message.reply(`💌MESSAGE: URL ADDED SUCCESSFULLY\n🟡NAME: ${response.data.name}\n🖇️URL: ${response.data.url}`);

  } catch (e) {
    console.log(e);
    message.reply(`An error occurred: ${e.message}`);
  }
};
