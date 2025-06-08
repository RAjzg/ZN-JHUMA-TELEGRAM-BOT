const axios = require('axios');

const baseApiUrl = async () => {
  const base = await axios.get('https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json');
  return base.data.api;
};

module.exports.config = {
  name: "babe",
  version: "1.0",
  credits: "Dipto",
  role: 0,
  usePrefix: true,
  description: "Talk to baby bot",
  commandCategory: "fun",
  guide: "baby [message]",
  coolDowns: 5,
  premium: false
};

module.exports.run = async ({ event, message, args }) => {
  if (!args[0]) return message.reply('Please provide a message');

  const userMessage = args.join(' ');
  const author = event.sender_id || event.from?.id;

  try {
    const apiBase = await baseApiUrl();
    const apiUrl = ${apiBase}/baby?text=${encodeURIComponent(userMessage)}&senderID=${author};
    const response = await axios.get(apiUrl);
    const replyText = response.data.reply;

    const sentMessage = await message.reply(replyText);
    const infoID = sentMessage.message_id;

    global.functions.reply.set(infoID, {
      commandName: module.exports.config.name,
      type: "reply",
      messageID: infoID,
      author,
      data: replyText
    });

  } catch (error) {
    console.error('Error:', error);
    message.reply('Sorry, something went wrong!');
  }
};

module.exports.reply = async function ({ event, message, args, Reply }) {
  const { data } = Reply;
  const userMessage = args.join(' ');
  const author = event.sender_id || event.from?.id;

  try {
    const apiBase = await baseApiUrl();
    const apiUrl = ${apiBase}/baby?text=${encodeURIComponent(userMessage)}&senderID=${author};
    const response = await axios.get(apiUrl);
    const replyText = response.data.reply;

    const sentMessage = await message.reply(replyText);
    const infoID = sentMessage.message_id;

    global.functions.reply.set(infoID, {
      commandName: module.exports.config.name,
      type: "reply",
      messageID: infoID,
      author,
      data: replyText
    });

  } catch (error) {
    console.error('Error:', error);
    message.reply("Sorry, I couldn't process your reply 🦆");
  }
};
