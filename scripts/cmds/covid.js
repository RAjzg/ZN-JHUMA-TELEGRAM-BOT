const axios = require("axios");
const fs = require("fs");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "covid",
  version: "1.0",
  role: 0,
  author: "Shaon Ahmed (Modified by Shaon Ahmed)",
  description: "Shows Covid-19 info for a country and the world including yesterday's stats with flag",
  category: "𝗜𝗡𝗙𝗢",
  cooldown: 10,
  guide: "{pn} [country name]\nExample: {pn} Bangladesh"
};

module.exports.onStart = async ({ event, args, message }) => {
  const country = args.join(" ");
  if (!country) return message.reply("🌍 একটি দেশের নাম লিখুন!\nযেমন: covid Bangladesh");

  try {
    // আজকের দেশের Covid তথ্য
    const todayData = await axios.get(`https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}?strict=true`);
    const todayCases = todayData.data.todayCases || 0;
    const todayDeaths = todayData.data.todayDeaths || 0;
    const flagUrl = todayData.data.countryInfo.flag;
    const countryName = todayData.data.country;

    // গতকালের তথ্য
    const yesterdayData = await axios.get(`https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}?yesterday=true&strict=true`);
    const yesterdayCases = yesterdayData.data.todayCases || 0;
    const yesterdayDeaths = yesterdayData.data.todayDeaths || 0;

    // গত ৭ দিনের ইতিহাস
    const history = await axios.get(`https://disease.sh/v3/covid-19/historical/${encodeURIComponent(country)}?lastdays=8`);
    const timeline = history.data.timeline;
    const cases = Object.values(timeline.cases);
    const deaths = Object.values(timeline.deaths);
    const weeklyCases = cases[cases.length - 1] - cases[0];
    const weeklyDeaths = deaths[deaths.length - 1] - deaths[0];

    // বিশ্ব তথ্য
    const worldToday = await axios.get("https://disease.sh/v3/covid-19/all");
    const worldYesterday = await axios.get("https://disease.sh/v3/covid-19/all?yesterday=true");

    const worldTodayCases = worldToday.data.todayCases || 0;
    const worldTodayDeaths = worldToday.data.todayDeaths || 0;
    const worldYestCases = worldYesterday.data.todayCases || 0;
    const worldYestDeaths = worldYesterday.data.todayDeaths || 0;

    const msg = 
`🦠 COVID-19 রিপোর্ট (${countryName}):
━━━━━━━━━━━━━━━━━━
📆 আজকের তথ্য:
➤ নতুন আক্রান্ত: ${todayCases.toLocaleString()}
➤ নতুন মৃত্যু: ${todayDeaths.toLocaleString()}

📆 গতকালের তথ্য:
➤ আক্রান্ত: ${yesterdayCases.toLocaleString()}
➤ মৃত্যু: ${yesterdayDeaths.toLocaleString()}

📊 গত ৭ দিনে:
➤ মোট আক্রান্ত: ${weeklyCases.toLocaleString()}
➤ মোট মৃত্যু: ${weeklyDeaths.toLocaleString()}

🌍 সারাবিশ্বে:
📆 আজ:
➤ আক্রান্ত: ${worldTodayCases.toLocaleString()}
➤ মৃত্যু: ${worldTodayDeaths.toLocaleString()}

📆 গতকাল:
➤ আক্রান্ত: ${worldYestCases.toLocaleString()}
➤ মৃত্যু: ${worldYestDeaths.toLocaleString()}
━━━━━━━━━━━━━━━━━━`;

    // Flag নামিয়ে মেসেজে পাঠানো
    const filePath = path.join(__dirname, "caches", `flag-${Date.now()}.png`);
    request(flagUrl).pipe(fs.createWriteStream(filePath)).on("close", () => {
      message.send({
        body: msg,
        attachment: fs.createReadStream(filePath)
      }).then(() => fs.unlinkSync(filePath));
    });

  } catch (e) {
    console.error(e);
    message.reply("❌ দেশটি খুঁজে পাওয়া যায়নি বা তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন ইংরেজিতে লিখে।");
  }
};
