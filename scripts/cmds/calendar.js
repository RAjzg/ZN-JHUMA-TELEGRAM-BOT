const axios = require("axios");
const moment = require("moment-timezone");
require("moment/locale/bn");

// ==== config ====
module.exports.config = {
  name: "calendar",
  version: "15.0.0",
  role: 0,
  credits: "Shaon Ahmed",
  usePrefix: true,
  description: "Stylish Calendar with Bengali & Hijri (approx, API free)",
  category: "calendar",
  usages: "/calendar",
  cooldowns: 10
};

// বাংলা মাস
const banglaMonths = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
];

// হিজরি মাস (বাংলা উচ্চারণ)
const hijriMonthsBn = {
  "Muharram": "মুহাররম",
  "Safar": "সফর",
  "Rabiʻ I": "রবিউল আউয়াল",
  "Rabiʻ II": "রবিউস সানি",
  "Jumada I": "জমাদিউল আউয়াল",
  "Jumada II": "জমাদিউস সানি",
  "Rajab": "রজব",
  "Shaʻban": "শাবান",
  "Ramadan": "রমজান",
  "Shawwal": "শাওয়াল",
  "Dhuʻl-Qiʻdah": "জিলকদ",
  "Dhuʻl-Hijjah": "জিলহজ"
};

// বাংলা সংখ্যা কনভার্ট
const banglaNumbers = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
const convertToBangla = (num) =>
  num.toString().split("").map(n => banglaNumbers[n] || n).join("");

// লিপ ইয়ার চেক
function isGregorianLeap(year) {
  return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
}

// বাংলা তারিখ বের করা
function getBanglaDate(gDate) {
  const gy = gDate.getFullYear();
  const startThis = new Date(gy, 3, 14); // 14 April
  let bYear, startOfYear;

  if (gDate >= startThis) {
    bYear = gy - 593;
    startOfYear = startThis;
  } else {
    bYear = gy - 594;
    startOfYear = new Date(gy - 1, 3, 14);
  }

  const gyForLeap = startOfYear.getFullYear() + 1;
  const falgunDays = isGregorianLeap(gyForLeap) ? 30 : 29;
  const monthLengths = [31,31,31,31,31,30,30,30,30,30,falgunDays,30];

  const msPerDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(startOfYear.getFullYear(), startOfYear.getMonth(), startOfYear.getDate());
  const d2 = new Date(gDate.getFullYear(), gDate.getMonth(), gDate.getDate());
  let daysPassed = Math.floor((d2 - d1) / msPerDay);

  let mIndex = 0;
  while (mIndex < 12 && daysPassed >= monthLengths[mIndex]) {
    daysPassed -= monthLengths[mIndex];
    mIndex++;
  }

  return {
    year: convertToBangla(bYear),
    month: banglaMonths[mIndex] || "অজানা",
    day: convertToBangla(daysPassed + 1)
  };
}

// ===== Command Handler =====
module.exports.run = async ({ bot, msg }) => {
  const chatId = msg.chat.id;
  try {
    // Remote API থেকে calendar image আনবে
    const configUrl = "https://raw.githubusercontent.com/MR-IMRAN-60/ImranBypass/refs/heads/main/imran.json";
    const config = await axios.get(configUrl);
    const apiUrl = `${config.data.api}/cal`;

    // === Stream fetch ===
    const response = await axios.get(apiUrl, { responseType: "stream" });

    const now = new Date();

    // ইংরেজি তারিখ
    const englishDateDay = convertToBangla(now.getDate());

    // বাংলা তারিখ
    const banglaDate = getBanglaDate(now);

    // হিজরি তারিখ
    const hijriFormatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const hijriParts = hijriFormatter.formatToParts(now);
    const hijriDate = {
      day: convertToBangla(hijriParts.find(p => p.type === "day").value),
      month: hijriMonthsBn[hijriParts.find(p => p.type === "month").value] || hijriParts.find(p => p.type === "month").value,
      year: convertToBangla(hijriParts.find(p => p.type === "year").value)
    };

    // সময় (ঢাকা টাইম)
    const dhaka = moment.tz(now, "Asia/Dhaka");
    const timeRaw = dhaka.format("h:mmA");
    const time = convertToBangla(timeRaw);

    // === Caption ===
    const caption = `「 Stylish Calendar 」
📅 ইংরেজি তারিখ: ${englishDateDay}
🗒️ মাস: ${now.toLocaleString("en-US", { month: "long" })}
📛 দিন: ${now.toLocaleString("bn-BD", { weekday: "long" })}
🗓️ ${banglaDate.month} ${banglaDate.day}
🕌 ${hijriDate.month} ${hijriDate.day}
🕒 সময়: ${time}
━━━━━━━━━━━━━━━`;

    // Direct stream দিয়ে পাঠানো
    await bot.sendPhoto(chatId, response.data, { caption });

  } catch (err) {
    console.error(err);
    await bot.sendMessage(chatId, "⚠️ কিছু ভুল হয়েছে!");
  }
};
