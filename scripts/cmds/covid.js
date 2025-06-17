const axios = require("axios");
const fs = require("fs");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "covid",
  version: "1.1",
  role: 0,
  author: "Islamick Chat Bot (Converted by ChatGPT)",
  description: "Shows COVID-19 info of a country with flag",
  category: "𝗜𝗡𝗙𝗢",
  cooldown: 10,
  guide: "{pn} [country name]"
};

module.exports.onStart = async ({ event, args, message }) => {
  const country = args.join(" ");
  if (!country)
    return message.reply("🌍 একটি দেশের নাম লিখুন!\nযেমন: covid Bangladesh");

  try {
    const todayData = await axios.get(
      `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(
        country
      )}?strict=true`
    );

    const todayCases = todayData.data.todayCases || 0;
    const todayDeaths = todayData.data.todayDeaths || 0;
    const flagUrl = todayData.data.countryInfo.flag;
    const countryName = todayData.data.country;

    const yesterdayData = await axios.get(
      `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(
        country
      )}?yesterday=true&strict=true`
    );

    const yesterdayCases = yesterdayData.data.todayCases || 0;
    const yesterdayDeaths = yesterdayData.data.todayDeaths || 0;

    const history = await axios.get(
      `https://disease.sh/v3/covid-19/historical/${encodeURIComponent(
        country
      )}?lastdays=8`
    );

    const timeline = history.data.timeline;
    const cases = Object.values(timeline.cases);
    const deaths = Object.values(timeline.deaths);
    const weeklyCases = cases[cases.length - 1] - cases[0];
    const weeklyDeaths = deaths[deaths.length - 1] - deaths[0];

    const worldToday = await axios.get("https://disease.sh/v3/covid-19/all");
    const worldYesterday = await axios.get(
      "https://disease.sh/v3/covid-19/all?yesterday=true"
    );
    const worldTodayCases = worldToday.data.todayCases || 0;
    const worldTodayDeaths = worldToday.data.todayDeaths || 0;
    const worldYestCases = worldYesterday.data.todayCases || 0;
    const worldYestDeaths = worldYesterday.data.todayDeaths || 0;

    const msg = `🦠 COVID-19 রিপোর্ট (${countryName}):
━━━━━━━━━━━━━━━━━━
📆 আজকের তথ্য:
➤ নতুন আক্রান্ত: ${todayCases.toLocaleString()}
➤ নতুন মৃত্যু: ${todayDeaths.toLocaleString()}

📆 গতকালের তথ্য:
➤ নতুন আক্রান্ত: ${yesterdayCases.toLocaleString()}
➤ নতুন মৃত্যু: ${yesterdayDeaths.toLocaleString()}

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

    const cacheDir = path.join(__dirname, "caches");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `flag-${Date.now()}.png`);
    const writer = fs.createWriteStream(filePath);

    request(flagUrl)
      .pipe(writer)
      .on("finish", async () => {
        try {
          await message.stream({
            url: fs.createReadStream(filePath),
            caption: msg,
          });
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(err);
          await message.reply("⚠️ ফাইল পাঠাতে সমস্যা হয়েছে।");
        }
      })
      .on("error", async (err) => {
        console.error(err);
        await message.reply("⚠️ ফ্ল্যাগ ডাউনলোড করতে সমস্যা হয়েছে।");
      });
  } catch (err) {
    console.error(err);
    message.reply(
      "❌ দেশটি খুঁজে পাওয়া যায়নি বা তথ্য পাওয়া যায়নি। ইংরেজিতে সঠিক নাম লিখে আবার চেষ্টা করুন।"
    );
  }
};
