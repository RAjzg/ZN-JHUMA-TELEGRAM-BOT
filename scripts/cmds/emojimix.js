const axios = require('axios');

module.exports.config = {
  name: 'emojimix',
  version: '1.0.0',
  usePrefix: true,
  author: 'Shaon',
  category: 'Fun',
  role: 0,
  description: 'Mix two emojis and return a combination image.',
  guide: '[emoji1] [emoji2]',
  cooldowns: 5
};

module.exports.onStart = async ({ message, args }) => {
  if (args.length < 2) {
    return message.reply('⚠️ দুইটি ইমোজি দিন!\n\n📌 উদাহরণ: .emojimix 😍 🤯');
  }

  const [emoji1, emoji2] = args;

  try {
    const imageUrl = `https://web-api-delta.vercel.app/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;
    const imageStream = await axios.get(imageUrl, { responseType: 'stream' });

    return message.send({
      body: `🎨 ইমোজি মিক্স: ${emoji1} + ${emoji2}`,
      attachment: imageStream.data
    });

  } catch (error) {
    console.error('EmojiMix Error:', error.message);
    return message.reply(`❌ ইমেজ লোড করতে সমস্যা হয়েছে:\n${error.message}`);
  }
};
