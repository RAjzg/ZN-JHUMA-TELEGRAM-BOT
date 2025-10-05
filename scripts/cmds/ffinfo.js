const axios = require('axios');

module.exports = {
  config: {
    name: "ffinfo",
    version: "1.0",
    aliases: [],
    author: "SHAON AHMED",
    role: 0,
    description: "Shows Free Fire player info by UID",
    commandCategory: "info",
    guide: "/ff <UID>",
  },

  run: async function ({ message, event, args }) {
    const uid = args[0];

    if (!uid || !/^\d{8,10}$/.test(uid)) {
      return await message.reply("❌ দয়া করে সঠিকভাবে লিখো:\n/ffinfo <UID>\nউদাহরণ: /ffinfo 7196688868");
    }

    const apiUrl = `https://noobs-api-sable.vercel.app/ffinfo?uid=${uid}`;

    try {
      // API call with 15s timeout
      const res = await axios.get(apiUrl, { timeout: 15000 });
      const data = res.data;

      if (!data || data.error) {
        return await message.reply(`❌ Error: ${data?.error || "তথ্য পাওয়া যায়নি।"}`);
      }

      const basic = data.basicInfo;
      const clan = data.clanBasicInfo || {};
      const social = data.socialInfo || {};

      const createdAt = basic.createAt
        ? new Date(basic.createAt * 1000).toLocaleString('en-GB')
        : "N/A";

      const info = `
┏━━[ 𝐅𝐅 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 ]━━┓
┃
┃ ✦ 𝐏𝐋𝐀𝐘𝐄𝐑 𝐈𝐍𝐅𝐎
┃ 𝐔𝐈𝐃 ⤷ ${basic.accountId}
┃ 𝐍𝐀𝐌𝐄 ⤷ ${basic.nickname}
┃ 𝐑𝐄𝐆𝐈𝐎𝐍 ⤷ ${basic.region}
┃ 𝐋𝐄𝐕𝐄𝐋 ⤷ ${basic.level}
┃ 𝐋𝐈𝐊𝐄𝐃 ⤷ ${basic.liked}
┃ 𝐒𝐈𝐆𝐍𝐀𝐓𝐔𝐑𝐄 ⤷ ${social.signature || 'N/A'}
┃
┃ ✦ 𝐑𝐀𝐍𝐊𝐈𝐍𝐆
┃ 𝐁𝐑 𝐑𝐀𝐍𝐊 ⤷ ${basic.rank}
┃ 𝐂𝐒 𝐑𝐀𝐍𝐊 ⤷ ${basic.csRank}
┃
┃ ✦ 𝐆𝐔𝐈𝐋𝐃 𝐈𝐍𝐅𝐎
┃ 𝐆𝐔𝐈𝐋𝐃 𝐍𝐀𝐌𝐄 ⤷ ${clan.clanName || 'N/A'}
┃ 𝐆𝐔𝐈𝐋𝐃 𝐋𝐄𝐕𝐄𝐋 ⤷ ${clan.clanLevel || 'N/A'}
┃ 𝐌𝐄𝐌𝐁𝐄𝐑𝐒 ⤷ ${clan.memberNum || 'N/A'}/${clan.capacity || 'N/A'}
┃
┃ ✦ 𝐓𝐈𝐌𝐄𝐋𝐈𝐍𝐄
┃ 𝐀𝐂𝐂 𝐂𝐑𝐄𝐀𝐓𝐄𝐃 ⤷ ${createdAt}
┃
┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await message.reply(info);

    } catch (err) {
      console.error(err.response?.data || err.message);
      await message.reply("❌ তথ্য নিয়ে আসতে সমস্যা হয়েছে। আবার চেষ্টা করো।");
    }
  },
};
