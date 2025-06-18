const fs = require("fs");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "ig",
  version: "1.0",
  role: 0,
  author: "Shaon Ahmed",
  description: "Send random Islamic video with caption",
  category: "Islamic",
  cooldown: 5,
  guide: "{pn}"
};

module.exports.onStart = async ({ message }) => {
  const messages = [
    "ღ࿐– যখন বান্দার জ্বর হয়,😇\n🖤তখন গুনাহ গুলো ঝড়ে পড়তে থাকে☺️\n– হযরত মুহাম্মদ(সাঃ)●───༊༆",
    "┏━━━━ ﷽ ━━━━┓\n 🖤﷽স্মার্ট নয় ইসলামিক ﷽🥰\n 🖤﷽ জীবন সঙ্গি খুঁজুন ﷽🥰\n┗━━━━ ﷽ ━━━━┛",
    "⌢║🌼🖤\n⏤ সৌন্দর্যের আলাদা কোনো রং নেই\nআল্লাহর সৃষ্টি সব কিছুই সুন্দর.!!🖤\n🍁🌼",
    "༆❝শুকরিয়া আদায় করতে শিখুন❞🥰🥰࿐\nღ🌺༆❝আল্লাহ একদিন\nশ্রেষ্ঠ জিনিস টাই দিবেন...💞\n༎༊❞ইনশাআল্লাহ❝༎༊",
    "彡🌸\n যার চরিত্র যেমন, তার জীবন সাথীও হবে তেমন🌿\n [📖সূরা নূর- ২৬💛]༒",
    "💚🌻\n- নিজেকে কখনো অসুন্দর মনে করবেন না।\n- কারণ আল্লাহর সৃষ্টি কখনো\nঅসুন্দর হয় না। 🙂🥀🖤",
    "🦋🥀࿐\nლ_༎হাজারো༎স্বপ্নের༎শেষ༎স্থান༎••༊🙂🤲🥀\n♡_༎কবরস্থান༎_❤\n🦋🥀࿐"
  ];

  const videos = [
    "https://i.imgur.com/g0dpYGm.mp4",
    "https://drive.google.com/uc?id=1my0Qs9K60k3V0pb3AVZ1P-IE9Nhx4NOm",
    "https://drive.google.com/uc?id=1mvRxV8PgSg4ja10BVPpGx7dU-cYc3vB",
    "https://drive.google.com/uc?id=1mzkKdGjYXd3xFTQmLK7_Q87bf9Lu4235",
    "https://drive.google.com/uc?id=1msyXgtT8SlcGHwjAm3cQlKiAssEO-AgI",
    "https://drive.google.com/uc?id=1mrkeN6G8swlt_TMiieZc6weTTfdYbmCy",
    "https://drive.google.com/uc?id=1mwcqRtHqK6NQ1JDCnML1FDVfAyzEjid0",
    "https://drive.google.com/uc?id=1mvnHD8d5M3eB_8-Hj6WrsVKDA2jY01zi",
    "https://drive.google.com/uc?id=1n-rRk7l6nDAm7sE-jq7_VZ_g94wUIX6R",
    "https://drive.google.com/uc?id=1myeNLFM_xsURi-5Da1C6SPdBzIh9T3eu",
    "https://drive.google.com/uc?id=1n07KO6utKhAjzo5ClGBI4rm21hU7TRJ3",
    "https://drive.google.com/uc?id=1n18bbYJjWZwJc6zgtMdDfYz-GZLeYzWr",
    "https://drive.google.com/uc?id=1n1ykGuOt5PZIl-U5M9cEKBNWTMOal9Kz",
    "https://drive.google.com/uc?id=1n8Au3E_2cODbHi6GB3Ddj_0fDCkAyGO6",
    "https://drive.google.com/uc?id=1n9qCgBPOaP0BQyyo9mP_nH8POHz20dPv",
    "https://drive.google.com/uc?id=1n4nDNNF80zWxBr5UhFTrIM33AkIRrOPW",
    "https://drive.google.com/uc?id=1n50YEBNZ6DMpi7A6IXsLsM_QHH2sugN7",
    "https://drive.google.com/uc?id=1n5Aeo3_tnVWaVOj0NdfkWr36-qYWDwDQ",
    "https://drive.google.com/uc?id=1n6QckgpiUHY8RBqM3NcqzROVdf1Q0MvR",
    "https://drive.google.com/uc?id=1n6jGOVyk3mMTIcv7Yv3kIpFEgOggEKu4"
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  const randomVideo = videos[Math.floor(Math.random() * videos.length)];

  const cacheDir = path.join(__dirname, "caches");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `video-${Date.now()}.mp4`);
  const writer = fs.createWriteStream(filePath);
  request(encodeURI(randomVideo)).pipe(writer);

  writer.on("finish", () => {
    message.stream({
      url: fs.createReadStream(filePath),
      caption: `『 ${randomMessage} 』\n\n🍂𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁 : 𝚂𝙷𝙰𝙾𝙽 𝙰𝙷𝙼𝙴𝙳...🌸`
    }).finally(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  });

  writer.on("error", (err) => {
    console.error("❌ ভিডিও ডাউনলোড সমস্যা:", err);
    message.reply("⚠️ ভিডিও ডাউনলোডে সমস্যা হয়েছে!");
  });
};
