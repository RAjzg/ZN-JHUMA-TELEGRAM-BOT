const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tik",
  version: "2.0.0",
  role: 0,
  credits: "Shaon Ahmed",
  description: "Search and send TikTok video from a list",
  category: "media",
  usages: "/tik <search>",
  cooldowns: 5,
};

const searchCache = new Map();

module.exports.run = async function ({ message, args, event, api }) {
  const query = args.join(" ");
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!query) return message.reply("❌ লিখুন:\n/tiktok <search>");

  try {
    const res = await axios.get(`https://noobs-api-sable.vercel.app/tiktok/search?keywords=${encodeURIComponent(query)}`);
    const videos = res.data?.data?.videos;

    if (!Array.isArray(videos) || videos.length === 0) {
      return message.reply("❌ কোনো TikTok ভিডিও পাওয়া যায়নি।");
    }

    searchCache.set(threadID, videos);

    let list = `📄 TikTok ভিডিও লিস্ট:\n\n`;
    videos.slice(0, 10).forEach((v, i) => {
      list += `${i + 1}. ${v.title?.slice(0, 80)}\n`;
    });
    list += `\n👉 রিপ্লাই করুন 1-10 এর মধ্যে কোন ভিডিওটি দেখতে চান। সময়সীমা 30 সেকেন্ড`;

    api.sendMessage(list, threadID, (err, info) => {
      const handleReply = async (reply) => {
        if (reply.senderID !== event.senderID || reply.threadID !== threadID) return;

        const index = parseInt(reply.body) - 1;
        if (isNaN(index) || index < 0 || index >= videos.length) {
          return api.sendMessage("❌ সঠিক নাম্বার দিন (1-10)।", threadID);
        }

        const selected = videos[index];
        const videoUrl = selected.play;
        if (!videoUrl) return api.sendMessage("❌ ভিডিও URL পাওয়া যায়নি।", threadID);

        const filePath = path.join(__dirname, "caches", `tiktok_${Date.now()}.mp4`);
        const videoResp = await axios.get(videoUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        fs.writeFileSync(filePath, Buffer.from(videoResp.data));

        const caption = `🎬 𝗧𝗶𝗸𝗧𝗼𝗸\n🎵 Title: ${selected.title || "N/A"}`;

        message.stream({
          url: fs.createReadStream(filePath),
          caption,
        }, () => {
          setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 10000);
        });

        api.removeListener("message", handleReply);
        api.unsendMessage(info.messageID);
        searchCache.delete(threadID);
      };

      api.listenMqtt(handleReply);
      setTimeout(() => api.removeListener("message", handleReply), 30000);
    }, messageID);

  } catch (err) {
    console.error(err);
    message.reply("❌ কিছু সমস্যা হয়েছে TikTok সার্চ করতে।");
  }
};
