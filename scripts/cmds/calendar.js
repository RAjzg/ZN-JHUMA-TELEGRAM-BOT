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

// Hijri month English → Bengali mapping
const hijriMonthsBN = {
  "Muharram": "মুহররম",
  "Safar": "সফর",
  "Rabi al-awwal": "রাবিউল আউয়াল",
  "Rabi al-thani": "রাবিউস সানি",
  "Jumada al-awwal": "জুমাদাল আউয়াল",
  "Jumada al-thani": "জুমাদাল সানি",
  "Rajab": "রাজব",
  "Sha'ban": "শা'বান",
  "Ramadan": "রমজান",
  "Shawwal": "শাওয়াল",
  "Dhu al-Qi'dah": "জিলক্বদ",
  "Dhu al-Hijjah": "জিলহজ"
};

// ইংরেজি সংখ্যা → বাংলা সংখ্যা
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

// Gregorian → approximate Bengali date
function getBanglaDate(gDate) {
  const newYear = moment(`${gDate.year()}-04-14`);
  let diffDays = gDate.diff(newYear, "days");
  if (diffDays < 0) {
    const prevYearNew = moment(`${gDate.year() - 1}-04-14`);
    diffDays = gDate.diff(prevYearNew, "days");
  }

  const monthLengths = [31,31,31,31,31,30,30,30,30,30,30,30]; // approx
  let monthIndex = 0;
  while (diffDays >= monthLengths[monthIndex]) {
    diffDays -= monthLengths[monthIndex];
    monthIndex++;
    if (monthIndex > 11) monthIndex = 11;
  }

  const banglaMonth = banglaMonths[monthIndex];
  const banglaDay = diffDays + 1;
  return { banglaMonth, banglaDay };
}

module.exports.config = {
  name: "calendar",
  version: "12.2.0",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Stylish calendar with Bengali and Hijri date",
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

  // Hijri date from API
  let islamicDate = "নির্ধারিত নেই";
  try {
    const hijriResponse = await axios.get(`http://api.aladhan.com/v1/gToH?date=${gDate.format("DD-MM-YYYY")}`);
    if (hijriResponse.data?.data?.hijri) {
      const hDay = toBanglaNumber(hijriResponse.data.data.hijri.day);
      const hMonthEng = hijriResponse.data.data.hijri.month.en;
      const hMonthBN = hijriMonthsBN[hMonthEng] || hMonthEng;
      islamicDate = `${hMonthBN} ${hDay}`;
    }
  } catch (err) {
    console.error("Hijri API failed:", err);
    islamicDate = "API ব্যর্থ, নির্ধারিত নেই";
  }

  const time = formatBanglaTime(gDate);

  const captionMsg = `
「 Stylish Calendar 」

${engDate}

ইংরেজি তারিখ: ${engDay}

মাস: ${gDate.format("MMMM")}

দিন: ${dayOfWeek}

${banglaDate}

হিজরি: ${islamicDate}

- সময়: ${time}
  `;

  // Try calendar image
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
    // Fallback: send caption only
    await bot.sendMessage(chatId, captionMsg);
  }
};
