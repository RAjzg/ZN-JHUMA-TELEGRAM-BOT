module.exports.config = {
  name: "newbox",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat (Modified by Shaon Ahmed)",
  usePrefix: true,
  description: "Create a new group with mentioned users (auto add if possible)",
  category: "media",
  usages: "newbox @user1 @user2 ...",
  cooldowns: 10,
};

module.exports.onStart = async function ({ event, api, global }) {
  const chatId = event.threadID;
  const mentions = event.mentions || {};
  const userIds = Object.keys(mentions);

  if (userIds.length === 0) {
    return api.sendMessage("⚠️ অন্তত একজনকে মেনশন করুন।", chatId);
  }

  try {
    // Token বাইরে থেকে নেওয়া হবে (config.json / .env / global.botToken)
    const TelegramBot = require('node-telegram-bot-api');
    const groupTitle = "New Box Group";

    // নতুন গ্রুপ তৈরি (প্রথমে শুধু কমান্ড দাতা)
    const newChat = await bot.createChat([event.senderID], groupTitle);

    // মেনশন করা ইউজারদের এড করার চেষ্টা
    for (let id of userIds) {
      try {
        await bot.addChatMember(newChat.id, parseInt(id));
      } catch (err) {
        console.error(`ইউজার ${id} এড হয়নি:`, err.message);
      }
    }

    api.sendMessage(`✅ "${groupTitle}" তৈরি হয়েছে এবং ইউজারদের এড করার চেষ্টা করা হয়েছে।`, chatId);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ গ্রুপ তৈরি বা ইউজার এড করতে সমস্যা হয়েছে।", chatId);
  }
};
