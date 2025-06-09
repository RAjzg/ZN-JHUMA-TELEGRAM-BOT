const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'emojimix',
  version: '1.0.2',
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
    const filePath = path.join(__dirname, 'caches', `emojimix_${Date.now()}.png`);

    const response = await axios.get(imageUrl, { responseType: 'stream' });

    // ফাইল cache ফোল্ডারে সেভ করা
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      message.send({
        body: `🎨 ${emoji1} + ${emoji2} =`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        // শেষে temp ফাইল মুছে ফেলা
        fs.unlinkSync(filePath);
      });
    });

    writer.on('error', (err) => {
      console.error('Write stream error:', err);
      message.reply('❌ ফাইল লেখার সময় সমস্যা হয়েছে।');
    });

  } catch (error) {
    console.error('EmojiMix Error:', error.message);
    return message.reply(`❌ ইমেজ লোড করতে সমস্যা হয়েছে:\n${error.message}`);
  }
};
