const { default: axios } = require("axios");
const fs = require("fs");
const { getBuffer } = require("../lib/myfunc");

module.exports = {
  name: "sing",
  alias: ["play", "ytmusic", "song"],
  desc: "Search and download music from YouTube",
  category: "Media",
  usage: "sing <query>",
  react: "🎵",
  start: async (Miku, m, { text, prefix, args, pushName }) => {
    if (!text) return m.reply(`🔎 *Please provide a song name to search!*`);

    try {
      const response = await axios.get(`https://noobs-api-sable.vercel.app/ytsearch?query=${encodeURIComponent(text)}`);
      const results = response.data.results;

      if (!Array.isArray(results) || results.length === 0) {
        return m.reply("⭕ No search results found for your query.");
      }

      const listText = results
        .map((item, index) => {
          return `${index + 1}. ${item.title}\nTime: ${item.time}\nChannel: ${item.channel}`;
        })
        .join("\n\n");

      const message = `*SHAON AHMED*\n\n${listText}\n\nReply to this message with a number to download the audio.`;

      const sentMsg = await Miku.sendMessage(m.chat, { text: message }, { quoted: m });

      // Store video list by message ID
      global.videoList = global.videoList || {};
      global.videoList[sentMsg.key.id] = results;

    } catch (error) {
      console.error(error);
      return m.reply("❌ সার্চ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন!");
    }
  },
  onReply: async (Miku, m) => {
    try {
      const replied = m.quoted;
      if (!replied) return;

      const msgId = replied.key.id;
      if (!global.videoList || !global.videoList[msgId]) return;

      const index = parseInt(m.body.trim()) - 1;
      if (isNaN(index) || index < 0 || index >= global.videoList[msgId].length) {
        return m.reply("❌ Invalid number. Try again.");
      }

      const selectedVideo = global.videoList[msgId][index];
      const videoUrl = selectedVideo.url;

      // Download using ytmp3 API
      const audioRes = await axios.get(`https://noobs-api-sable.vercel.app/ytmp3?url=${encodeURIComponent(videoUrl)}`);
      const audio = audioRes.data;

      if (!audio || !audio.audio || audio.audio === "") {
        return m.reply("⭕ Sorry, audio not available or an error occurred.");
      }

      const audioBuffer = await getBuffer(audio.audio);
      await Miku.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: "audio/mp4",
        fileName: `${selectedVideo.title}.mp3`,
      }, { quoted: m });

      delete global.videoList[msgId]; // Clear cache after download

    } catch (e) {
      console.log(e);
      return m.reply("❌ একটি সমস্যা হয়েছে অডিও ডাউনলোড করতে!");
    }
  },
};
