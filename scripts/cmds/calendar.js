const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

// বাংলা মাসের নাম
const banglaMonths = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ",
  "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ",
  "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
];

// বাংলা সপ্তাহের নাম
const banglaDays = [
  "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার",
  "বৃহস্পতিবার", "শুক্রবার", "শনিবার"
];

// ইংরেজি সংখ্যা কে বাংলা সংখ্যায় রূপান্তর
function toBanglaNumber(num) {
  return num.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
}

// রাত/সকাল বাংলায়
function formatBanglaTime(date) {
  const hour = date.hour();
  const minute = date.minute();
  const ampm = hour >= 12 ? "রাত" : "সকাল";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${toBanglaNumber(h)}:${toBanglaNumber(minute)} ${ampm}`;
}

module.exports.config = {
  name: "calendar",
  version: "11.9.8",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Stylish calendar with fallback if API fails",
  category: "calendar",
  usages: "/calendar",
  cooldowns: 30,
};

module.exports.run = async function ({ bot, msg }) {
  const chatId = msg.chat.id;
  const date = moment().tz("Asia/Dhaka");

  // Generate caption
  const engDate = date.format("MMMM DD"); // English date e.g., July 17
  const engDay = date.format("DD");
  const banglaDay = toBanglaNumber(date.date());
  const banglaMonth = banglaMonths[date.month()];
  const banglaDate = `${banglaMonth} ${banglaDay}`;
  const dayOfWeek = banglaDays[date.day()];
  const islamicDate = "রবিউস সানি ৭"; // Static fallback
  const time = formatBanglaTime(date);

  const captionMsg = `
「 Stylish Calendar 」

${engDate}

ইংরেজি তারিখ: ${toBanglaNumber(engDay)}

মাস: ${date.format("MMMM")}

দিন: ${dayOfWeek}

${banglaDate}

${islamicDate}

- সময়: ${time}
  `;

  // Try to get calendar image from API
  try {
    const url = `https://api.popcat.xyz/calendar?month=${date.format("M")}&year=${date.format("YYYY")}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `calendar_${Date.now()}.png`);
    fs.writeFileSync(filePath, response.data);

    // Send photo with caption
    await bot.sendPhoto(chatId, fs.createReadStream(filePath), { caption: captionMsg });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("Calendar Image API failed:", err);

    // Fallback: Send only caption if API fails
    await bot.sendMessage(chatId, captionMsg);
  }
};
