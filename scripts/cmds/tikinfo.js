const axios = require("axios");

module.exports.config = {
  name: "tikinfo",
  version: "1.0.1",
  role: 0,
  credits: "Shaon Ahmed",
  description: "Get TikTok user info by username",
  category: "media",
  usages: "/tikinfo <username>",
  cooldowns: 5,
};

module.exports.run = async function ({ message, args }) {
  const username = args.join(" ").replace("@", "").trim();

  if (!username) {
    return message.reply("❌ লিখুন:\n/tiktokinfo <tiktok_username>");
  }

  try {
    const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
    const Shaon = apis.data.alldl;

    const res = await axios.get(`${Shaon}/tiktok/info`, {
      params: { unique_id: username }
    });

    const data = res.data;
    if (data.error) {
      return message.reply(`❌ ইউজার খুঁজে পাওয়া যায়নি বা ভুল ইউজারনেম: ${username}`);
    }

    const caption = 
`👤 𝗧𝗶𝗸𝗧𝗼𝗸 𝗨𝘀𝗲𝗿 𝗜𝗻𝗳𝗼

🆔 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${data.username}
📛 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲: ${data.nickname}
📝 𝗕𝗶𝗼: ${data.signature || "N/A"}
🔗 𝗕𝗶𝗼 𝗟𝗶𝗻𝗸: ${data.bioLink?.link || "None"}
🎬 𝗩𝗶𝗱𝗲𝗼𝘀: ${data.videoCount}
👥 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀: ${data.followerCount}
🔁 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴: ${data.followingCount}
❤️ 𝗟𝗶𝗸𝗲𝘀: ${data.heartCount}
🔗 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻: ${data.relation || "N/A"}`;

    const avatarStream = (await axios.get(data.avatarLarger, { responseType: "stream" })).data;

    message.stream({
      url: avatarStream,
      caption: caption
    });

  } catch (e) {
    console.error(e);
    message.reply("❌ TikTok info আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
  }
};
