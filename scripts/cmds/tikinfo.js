const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tikinfo",
  version: "1.0.2",
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
`
┏━━[ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 ]━━┓
┃
┃ ✦ 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎
┃ 🆔 আইডি ⤷ ${data.id || "N/A"}
┃ 👤 নাম ⤷ ${data.username || "N/A"}
┃ 📛 ইউজারনেম ⤷ ${data.nickname || "N/A"}
┃ 💬 বায়ো ⤷ ${data.signature || "N/A"}
┃ 🌍 দেশ ⤷ 🇧🇩 বাংলাদেশ
┃ 
┃ ✦ 𝐒𝐓𝐀𝐓𝐒
┃ 🎥 ভিডিও ⤷ ${data.videoCount || 0}
┃ 👥 ফলোয়ার্স ⤷ ${data.followerCount || 0}
┃ 👤 ফলোয়িং ⤷ ${data.followingCount || 0}
┃ ❤️ লাইক ⤷ ${data.heartCount || 0}
┃ 
┃ ✦ 𝐋𝐈𝐍𝐊
┃ 🔗 প্রোফাইল ⤷ https://www.tiktok.com/@${data.nickname}
┃
┗━━━━━━━━━━━━━━━━━━━━┛
`;

    // Ensure caches folder exists
    const cachesDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cachesDir)) fs.mkdirSync(cachesDir);

    // Download avatar image locally
    const filePath = path.join(cachesDir, `avatar_${Date.now()}.jpg`);
    const response = await axios.get(data.avatarLarger, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(response.data));

    // Send with message.stream
    message.stream({
      url: filePath,
      caption: caption
    });

    // Delete file after 10 seconds
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 10000);

  } catch (e) {
    console.error(e);
    message.reply("❌ TikTok info আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
  }
};
