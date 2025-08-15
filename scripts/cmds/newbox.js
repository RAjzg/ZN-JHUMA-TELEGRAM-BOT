module.exports.config = {
  name: "newbox",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat (Modified by Shaon Ahmed)",
  usePrefix: true,
  description: "Create a new Telegram group with mentioned users (auto add if possible, else send link)",
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
    // token গ্লোবাল কনফিগ বা .env থেকে নেয়া হবে
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(global.botToken || process.env.TELEGRAM_TOKEN, { polling: false });

    const groupTitle = "New Box Group";

    // নতুন গ্রুপ তৈরি (প্রথমে শুধু কমান্ডদাতা)
    const newChat = await bot.createChat([event.senderID], groupTitle);

    let failedUsers = [];
    for (let id of userIds) {
      try {
        await bot.addChatMember(newChat.id, parseInt(id));
      } catch (err) {
        console.error(`ইউজার ${id} এড হয়নি:`, err.message);
        failedUsers.push(id);
      }
    }

    // ইনভাইট লিঙ্ক তৈরি
    const inviteLink = await bot.exportChatInviteLink(newChat.id);

    // ফাইনাল মেসেজ তৈরি (ফাঁকা হবে না)
    let messageText = `✅ "${groupTitle}" তৈরি হয়েছে।`;

    if (failedUsers.length > 0) {
      messageText += `\n⚠️ ${failedUsers.length} জনকে সরাসরি এড করা যায়নি, তারা এই লিঙ্ক দিয়ে জয়েন করতে পারবে: ${inviteLink}`;
    } else {
      messageText += `\n📌 ইনভাইট লিঙ্ক: ${inviteLink}`;
    }

    if (!messageText.trim()) {
      messageText = "ℹ️ নতুন গ্রুপ তৈরি হয়েছে।";
    }

    api.sendMessage(messageText, chatId);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ গ্রুপ তৈরি বা ইউজার এড করতে সমস্যা হয়েছে।", chatId);
  }
};
