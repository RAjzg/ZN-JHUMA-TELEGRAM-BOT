const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
  name: "autosend1",
  version: "10.02",
  hasPermssion: 2,
  credits: "Shaon Ahmed",
  description: "Auto message send every hour",
  usePrefix: true,
  commandCategory: "system",
  usages: "[]",
  cooldowns: 3
};

// ==========================================
// 👥 Group ID
// ==========================================
const GROUP_IDS = [
  "-1002273617785"
];

// ==========================================
// 🎥 Status API
// ==========================================
const STATUS_API =
  "http://de3.bot-hosting.net:20115/video/status2";

// ==========================================
// 📝 Auto messages
// ==========================================
const messages = [
`🔔 ===『 𝗔𝗨𝗧𝗢𝗦𝗘𝗡𝗗 』=== 🔔
━━━━━━━━━━━━━━━━
➝ 𝗡𝗼𝘄 𝗜𝘀: {time}

💬: {thinh}

━━━━━━━━━━━━━━━━━━
➝ 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗖 𝗦𝗘𝗡𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘`,

`🔔 ===『 𝗔𝗨𝗧𝗢𝗦𝗘𝗡𝗗 』=== 🔔
━━━━━━━━━━━━━━━━
➝ 𝗡𝗼𝘄 𝗜𝘀: {time}

💬: {thinh}

━━━━━━━━━━━━━━━━━━
➝ 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗖 𝗦𝗘𝗡𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘`,

`🔔 ===『 𝗔𝗨𝗧𝗢𝗦𝗘𝗡𝗗 』=== 🔔
━━━━━━━━━━━━━━━━
➝ 𝗡𝗼𝘄 𝗜𝘀: {time}

💬: {thinh}

━━━━━━━━━━━━━━━━━━
➝ 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗖 𝗦𝗘𝗡𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘`
];

function randomMessage() {
  return messages[
    Math.floor(Math.random() * messages.length)
  ];
}

// ==========================================
// 🚀 Start
// ==========================================
module.exports.onLoad = async ({ bot, api }) => {
  try {

    // আগের interval থাকলে বন্ধ করবে
    if (global.autosendmessage_setinterval) {
      clearInterval(
        global.autosendmessage_setinterval
      );
    }

    // একই সময়ে duplicate interval আটকাবে
    global.autosend1_lastHour = null;

    // ==========================================
    // ⏰ প্রতি ১ সেকেন্ডে check
    // ==========================================
    global.autosendmessage_setinterval =
      setInterval(async () => {

        try {

          const now =
            moment().tz("Asia/Dhaka");

          // প্রতি ঘণ্টার শুরুতে পাঠাবে
          if (
            now.minute() !== 0 ||
            now.second() !== 0
          ) {
            return;
          }

          const hourKey =
            now.format("YYYY-MM-DD-HH");

          // একই ঘণ্টায় দ্বিতীয়বার পাঠাবে না
          if (
            global.autosend1_lastHour === hourKey
          ) {
            return;
          }

          global.autosend1_lastHour =
            hourKey;

          console.log(
            "⏰ AUTOSEND TRIGGERED: " +
            now.format("DD/MM/YYYY hh:mm:ss A")
          );

          // ==========================================
          // 🎥 Get video
          // ==========================================
          const response =
            await axios.get(
              STATUS_API,
              {
                timeout: 15000
              }
            );

          const result =
            response.data;

          const title =
            result?.url?.title ||
            "No title";

          const videoUrl =
            result?.url?.url;

          if (!videoUrl) {
            console.log(
              "❌ Video URL পাওয়া যায়নি"
            );
            return;
          }

          // ==========================================
          // 📝 Caption তৈরি
          // ==========================================
          let text =
            randomMessage();

          text = text
            .replace(
              /{time}/g,
              now.format(
                "❰hh:mm:ss A❱ ⟬DD/MM/YYYY⟭ (dddd)"
              )
            )
            .replace(
              /{thinh}/g,
              title
            );

          // ==========================================
          // 📤 Send to groups
          // ==========================================
          for (const chatId of GROUP_IDS) {

            try {

              await api.sendVideo(
                chatId,
                videoUrl,
                {
                  caption: text
                }
              );

              console.log(
                "✅ AutoSend sent to: " +
                chatId
              );

            } catch (error) {

              console.error(
                "❌ Send failed " +
                chatId +
                ": " +
                error.message
              );

            }
          }

        } catch (error) {

          console.error(
            "❌ AutoSend Error:",
            error.message
          );

        }

      }, 1000);

    console.log(
      "======================================"
    );
    console.log(
      "✅ AUTOSEND1 STARTED"
    );
    console.log(
      "👥 Group: -1002273617785"
    );
    console.log(
      "💾 JSON: OFF"
    );
    console.log(
      "⏰ Timezone: Asia/Dhaka"
    );
    console.log(
      "⏰ Every Hour"
    );
    console.log(
      "🎥 Video: status3 API"
    );
    console.log(
      "======================================"
    );

  } catch (error) {

    console.error(
      "❌ AutoSend1 Load Error:",
      error
    );

  }
};

// ==========================================
// Command
// ==========================================
module.exports.run = async () => {};
