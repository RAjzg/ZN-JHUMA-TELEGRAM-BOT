const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

// বাংলা মাসের নাম (বাংলাদেশী পঞ্জিকা অনুযায়ী)
const banglaMonths = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ",
  "ভাদ্র", "আশ্বিন", "কার্তিক",
  "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
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

// Gregorian থেকে approximate Bangla date
function getBanglaDate(gDate) {
  // বাংলা নতুন বছর শুরু: 14/15 April
  const newYear = moment(`${gDate.year()}-04-14`);
  let diffDays = gDate.diff(newYear, "days");

  if (diffDays < 0) {
    // যদি তারিখ এপ্রিলের আগে হয়, আগের বছরের পঞ্জিকা
    const prevYearNew = moment(`${gDate.year() - 1}-04-14`);
    diffDays = gDate.diff(prevYearNew, "days");
  }

  // বাংলা মাসের দৈর্ঘ্য (15 বা 30/31 দিন)
  const monthLengths = [31,31,31,31,31,30,30,30,30,30,30,30]; // approx

  let monthIndex = 0;
  while (diffDays >= monthLengths[monthIndex]) {
    diffDays -= monthLengths[monthIndex];
    monthIndex++;
    if (monthIndex > 11) monthIndex = 11; // safeguard
  }

  const banglaMonth = banglaMonths[monthIndex];
  const banglaDay = diffDays + 1; // 1 থেকে শুরু
  return { banglaMonth, banglaDay };
}

module.exports.config = {
  name: "calendar",
  version: "12.0.0",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Stylish calendar with correct Bengali date",
  category: "calendar",
  usages: "/calendar",
  cooldowns: 30,
};

module.exports.run = async function ({ bot, msg }) {
  const chatId = msg.chat.id;
  const gDate = moment().tz("Asia/Dhaka");

  // English date
  const engDate = gDate.format("MMMM DD");
  const engDay = toBanglaNumber(gDate.format("DD"));
  const dayOfWeek = banglaDays[gDate.day()];

  // Bengali date
  const { banglaMonth, banglaDay } = getBanglaDate(gDate);
  const banglaDate = `${banglaMonth} ${toBanglaNumber(banglaDay)}`;

  // Islamic date (static example, change with API if needed)
  const islamicDate = "রবিউস সানি ৭";

  // Time
  const time = formatBanglaTime(gDate);

  const captionMsg = `
「 Stylish Calendar 」

${engDate}

ইংরেজি তারিখ: ${engDay}

মাস: ${gDate.format("MMMM")}

দিন: ${dayOfWeek}

${banglaDate}

${islamicDate}

- সময়: ${time}
  `;

  // Try sending calendar image
  try {
    const url = `https://calendar-eta-green.vercel.app/calendar?month=${gDate.format("M")}&year=${gDate.format("YYYY")}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `calendar_${Date.now()}.png`);
    fs.writeFileSync(filePath, response.data);

    await bot.sendPhoto(chatId, fs.createReadStream(filePath), { caption: captionMsg });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("Calendar Image API failed:", err);

    // Fallback: Send only caption
    await bot.sendMessage(chatId, captionMsg);
  }
};
