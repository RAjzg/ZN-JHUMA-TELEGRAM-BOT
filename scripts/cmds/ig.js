const fs = require("fs");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "ig",
  version: "1.0",
  role: 0,
  author: "Shaon Ahmed",
  description: "Send random Islamic video with caption on '/' message",
  category: "Islamic",
  cooldown: 5,
  guide: "{pn}"
};

const messages = [
  "ღ࿐– যখন বান্দার জ্বর হয়,😇\n🖤তখন গুনাহ গুলো ঝড়ে পড়তে থাকে☺️\n– হযরত মুহাম্মদ(সাঃ)●───༊༆",
  "┏━━━━ ﷽ ━━━━┓\n 🖤﷽স্মার্ট নয় ইসলামিক ﷽🥰\n 🖤﷽ জীবন সঙ্গি খুঁজুন ﷽🥰\n┗━━━━ ﷽ ━━━━┛",
  // আরও ম্যাসেজ চাইলে যোগ করো
];

const videos = [
  "https://i.imgur.com/g0dpYGm.mp4",
  "https://drive.google.com/uc?id=1my0Qs9K60k3V0pb3AVZ1P-IE9Nhx4NOm",
  // আরও ভিডিও চাইলে যোগ করো
];

module.exports.onStart = async ({ message, event }) => {
  if (message.text !== "/") return;

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  const randomVideo = videos[Math.floor(Math.random() * videos.length)];

  const cacheDir = path.join(__dirname, "caches");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `video-${Date.now()}.mp4`);
  const writer = fs.createWriteStream(filePath);

  request(encodeURI(randomVideo)).pipe(writer);

  writer.on("finish", async () => {
    try {
      await message.send({
        attachment: fs.createReadStream(filePath),
        body: `『 ${randomMessage} 』\n\n🍂𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁 : 𝚂𝙷𝙰𝙾𝙽 𝙰𝙷𝙼𝙴𝙳...🌸`
      });
    } catch (err) {
      console.error("❌ ভিডিও পাঠাতে সমস্যা:", err);
      await message.reply("⚠️ ভিডিও পাঠাতে সমস্যা হয়েছে!");
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  writer.on("error", async (err) => {
    console.error("❌ ভিডিও ডাউনলোড সমস্যা:", err);
    await message.reply("⚠️ ভিডিও ডাউনলোডে সমস্যা হয়েছে!");
  });
};
