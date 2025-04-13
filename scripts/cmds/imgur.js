const axios = require('axios');

module.exports.config = {
  name: "imgur",
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
    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
  const Shaon = apis.data.api;
  

    const imgurResponse = await axios.get(`${Shaon}/imgur?link=${encodeURIComponent(imageUrl)}`);

    message.reply(`✅Imgur link:\n${imgurResponse.data.uploaded.link}`);

  } catch (e) {
    console.log(e);
    message.reply(`An error occurred: ${e.message}`);
  }
};
