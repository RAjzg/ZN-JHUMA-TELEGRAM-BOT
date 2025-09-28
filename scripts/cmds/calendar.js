const puppeteer = require("puppeteer");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// বাংলা মাসের নাম
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

// রাত/সকাল বাংলায় (corrected)
function formatBanglaTime(date) {
  let hour = date.hour();
  const minute = date.minute();
  const isPM = hour >= 12;
  let period = isPM ? "রাত" : "সকাল";

  // 12 AM/PM handling
  let h = hour % 12;
  if (h === 0) h = 12;

  return `${toBanglaNumber(h)}:${toBanglaNumber(minute)} ${period}`;
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
  version: "13.1.0",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Stylish calendar with Bengali and Hijri date (fixed)",
  category: "calendar",
  usages: "/calendar",
  cooldowns: 30,
};

module.exports.run = async function({ bot, msg }) {
  const chatId = msg.chat.id;
  const gDate = moment().tz("Asia/Dhaka");
  const month = gDate.month() + 1;
  const year = gDate.year();

  // English date
  const engDate = gDate.format("MMMM DD");
  const engDay = toBanglaNumber(gDate.format("DD"));
  const dayOfWeek = banglaDays[gDate.day()];

  // Bengali date
  const { banglaMonth, banglaDay } = getBanglaDate(gDate);
  const banglaDate = `${banglaMonth} ${toBanglaNumber(banglaDay)}`;

  // Hijri date
  let islamicDate = "নির্ধারিত নেই";
  try {
    const hijriRes = await axios.get(`http://api.aladhan.com/v1/gToH?date=${gDate.format("DD-MM-YYYY")}`);
    if (hijriRes.data?.data?.hijri) {
      const hDay = toBanglaNumber(hijriRes.data.data.hijri.day);
      const hMonthEng = hijriRes.data.data.hijri.month.en;
      const hMonthBN = hijriMonthsBN[hMonthEng] || hMonthEng;
      islamicDate = `${hMonthBN} ${hDay}`;
    }
  } catch (err) {
    console.error("Hijri API failed:", err);
    islamicDate = "API ব্যর্থ, নির্ধারিত নেই";
  }

  // Time
  const time = formatBanglaTime(gDate);

  // Caption
  const captionMsg = `
「 Stylish Calendar 」

ইংরেজি তারিখ: ${engDay}

মাস: ${gDate.format("MMMM")}

দিন: ${dayOfWeek}

${banglaDate}

হিজরি: ${islamicDate}

- সময়: ${time}
  `;

  // Puppeteer screenshot
  try {
    const url = `https://calendar-eta-green.vercel.app/`;
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000 });
    await page.goto(url, { waitUntil: "networkidle2" });

    const filePath = path.join(__dirname, `calendar_${Date.now()}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    await browser.close();

    await bot.sendPhoto(chatId, fs.createReadStream(filePath), { caption: captionMsg });
    //fs.unlinkSync(filePath);

  } catch (err) {
    console.error("Screenshot error:", err);
    // Puppeteer fail হলে fallback: caption only
    await bot.sendMessage(chatId, captionMsg);
  }
};
