const moment = require('moment-timezone');

module.exports = {
  onChat: async ({ bot, msg }) => {
    if (msg.new_chat_members) {
      const newMembers = msg.new_chat_members.map(member => member.first_name).join(', ');
      const chatName = msg.chat.title || 'this group';

      try {
        // মেম্বার কাউন্ট পাওয়া
        const memberCount = await bot.getChatMembersCount(msg.chat.id);

        // সময় এবং তারিখ
        const time = moment().tz('Asia/Dhaka').format('HH:mm:ss');
        const date = moment().tz('Asia/Dhaka').format('MMMM Do YYYY');

        // Welcome Text
        const welcomeText = 
`👋 Hello, ${newMembers} 
🎉 Welcome to ${chatName}!
✨ You are the ${memberCount}th member.

🕒 Join time: ${time} (${date})
💖 Hello and have a wonderful day!`;

        // GIF লিস্ট থেকে র্যান্ডম একটা নির্বাচন
        const gifs = [
          'https://i.postimg.cc/wxDBKRHG/welcome4.gif',
          'https://i.postimg.cc/xTY19j1T/welcome2.gif',
          'https://i.postimg.cc/Gtnh8dPK/welcome3.gif'
        ];
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

        // মেসেজ পাঠানো (GIF সহ)
        await bot.sendAnimation(msg.chat.id, randomGif, { caption: welcomeText });

      } catch (error) {
        console.error('❌ Error fetching member count:', error);
        await bot.sendMessage(msg.chat.id, `Welcome ${newMembers} to ${chatName}!`);
      }
    }
  }
};
