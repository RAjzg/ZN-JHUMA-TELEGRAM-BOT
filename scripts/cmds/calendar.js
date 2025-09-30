const puppeteer = require("puppeteer");
const moment = require("moment-timezone");
require("moment/locale/bn");
const fs = require("fs");
const path = require("path");

// বাংলা মাস ও দিন
const banglaMonths = [
  "বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ",
  "ভাদ্র","আশ্বিন","কার্তিক",
  "অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"
];
const banglaDays = ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];

// Hijri months
const hijriMonthsBN = [
  "মুহররম","সফর","রাবিউল আউয়াল","রাবিউস সানি",
  "জুমাদাল আউয়াল","জুমাদাল সানি","রাজব","শা'বান",
  "রমজান","শাওয়াল","জিলক্বদ","জিলহজ"
];

// ইংরেজি সংখ্যা → বাংলা সংখ্যা
function toBanglaNumber(num){ 
  return num.toString().replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]); 
}

// সময় AM/PM সহ
function formatBanglaTime(date){
  let hour=date.hour(), minute=date.minute();
  let h = hour % 12; if(h===0) h=12;
  let period = hour >= 12 ? "PM" : "AM";
  return `${toBanglaNumber(h)}:${toBanglaNumber(minute)} ${period}`;
}

// Gregorian → approximate Bengali date
function getBanglaDate(gDate){
  const newYear = moment(`${gDate.year()}-04-14`);
  let diffDays = gDate.diff(newYear,"days");
  if(diffDays<0) diffDays = gDate.diff(moment(`${gDate.year()-1}-04-14`),"days");
  const monthLengths=[31,31,31,31,31,30,30,30,30,30,30,30];
  let monthIndex=0;
  while(diffDays>=monthLengths[monthIndex]){
    diffDays-=monthLengths[monthIndex]; monthIndex++;
    if(monthIndex>11) monthIndex=11;
  }
  return { banglaMonth: banglaMonths[monthIndex], banglaDay: diffDays+1 };
}

// Gregorian → approximate Hijri date (better approximation)
function getApproxHijri(gDate){
  // Known Hijri reference: 1 Muharram 1447 = 31 July 2025 (example)
  const knownHijriStart = moment("2025-07-31");
  let diffDays = gDate.startOf('day').diff(knownHijriStart, "days");

  if(diffDays < 0) diffDays = 0;

  // Hijri months pattern: alternating 30/29 days
  const hijriMonthLengths = [30,29,30,29,30,29,30,29,30,29,30,29]; 
  let hMonthIndex = 0;
  while(diffDays >= hijriMonthLengths[hMonthIndex]){
    diffDays -= hijriMonthLengths[hMonthIndex];
    hMonthIndex = (hMonthIndex + 1) % 12;
  }

  const hDay = diffDays + 1;
  const month = hijriMonthsBN[hMonthIndex];
  return { month, day: hDay };
}

module.exports.config = {
  name:"calendar",
  version:"15.1.0",
  role:0,
  credits:"Shaon Ahmed",
  usePrefix:true,
  description:"Stylish Calendar with Bengali & Hijri (approx, API free)",
  category:"calendar",
  usages:"/calendar",
  cooldowns:10
};

module.exports.run = async function({ bot, msg }){
  const chatId = msg.chat.id;
  const gDate = moment().tz("Asia/Dhaka");

  // English date
  const engDay = toBanglaNumber(gDate.format("DD"));
  const dayOfWeek = banglaDays[gDate.day()];

  // Bengali date
  const { banglaMonth, banglaDay } = getBanglaDate(gDate);
  const banglaDate = `${banglaMonth} ${toBanglaNumber(banglaDay)}`;

  // Hijri date approx
  const hijri = getApproxHijri(gDate);
  const islamicDate = `${hijri.month} ${toBanglaNumber(hijri.day)}`;

  // Time
  const time = formatBanglaTime(gDate);

  // Caption
  const captionMsg = `
「 Stylish Calendar 」

📅 ইংরেজি তার: ${engDay}
🗒️ মাস: ${gDate.format("MMMM")}
📛 দিন: ${dayOfWeek}
🗓️ ${banglaDate}
🕌 হিজরি: ${islamicDate}
🕒 সময়: ${time}
  `;

  // Puppeteer screenshot (optional)
  try {
    const url = `https://calendar-eta-green.vercel.app/`;
    const browser = await puppeteer.launch({ args:["--no-sandbox","--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width:1200, height:1500 });
    await page.goto(url, { waitUntil:"networkidle2" });

    await page.waitForSelector("#root"); // adjust according to calendar container
    const element = await page.$("#root");

    const filePath = path.join(__dirname,`calendar_${Date.now()}.png`);
    await element.screenshot({ path:filePath });
    await browser.close();

    await bot.sendPhoto(chatId, fs.createReadStream(filePath), { caption:captionMsg });
    fs.unlinkSync(filePath);

  } catch(err){
    console.error("Screenshot error:", err);
    // fallback: text only
    await bot.sendMessage(chatId, captionMsg);
  }
};
