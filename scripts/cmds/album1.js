const axios = require("axios");

module.exports.config = {
  name: "album1",
  version: "3.0.1",
  hasPermission: 0,
  credits: "Shaon Ahmed (fixed by ChatGPT)",
  description: "Category-based album with add, list, view using handleReply",
  commandCategory: "media",
  usages: "[list | add <category> | <category>]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const input = args.join(" ");
  const { messageReply, threadID, messageID, senderID } = event;

  const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
  const Shaon = apis.data.api;
  const Imgur = apis.data.imgur;

  // 🟩 Show List
  if (input === "list" || input === "") {
    try {
      const res = await axios.get(`${Shaon}/album?list=true`);
      const lines = res.data.data.split("\n");
      const categories = [];

      let msg = "╭─『 🎬 VIDEO ALBUM 』─╮\n";
      lines.forEach((line, i) => {
        const match = line.match(/\d+\. Total (.*?) videos available/);
        if (match) {
          const category = match[1];
          categories.push(category);
          msg += `│ ${(i + 1).toString().padStart(2, "0")}. ${category} Video\n`;
        }
      });
      msg += "╰────────────────────╯\n\n✨ Reply with number (1–15) to watch";

      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          categories
        });
      });
    } catch (err) {
      return api.sendMessage("❌ লিস্ট আনতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }

  // 🟩 Add Media
  if (input.startsWith("add ")) {
    const category = input.slice(4).trim();

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0)
      return api.sendMessage("⚠️ একটি ভিডিও বা ছবি reply করে লিখুন: /album1 add <category>", threadID, messageID);

    const media = messageReply.attachments[0];
    if (!["video", "photo"].includes(media.type))
      return api.sendMessage("⚠️ শুধুমাত্র ছবি বা ভিডিওই যোগ করা যাবে।", threadID, messageID);

    try {
      const imageUrl = media.url;
      const imgur = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(imageUrl)}`);
      const imgurLink = imgur.data.link || imgur.data.uploaded?.image;

      if (!imgurLink) throw new Error("Imgur upload failed");

      await axios.get(`${Shaon}/album?add=${encodeURIComponent(category)}&url=${encodeURIComponent(imgurLink)}`);
      return api.sendMessage(`✅ মিডিয়া "${category}" ক্যাটাগরিতে যোগ হয়েছে।`, threadID, messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ মিডিয়া যোগ করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }

  // 🟩 View Media by Category
  if (input) {
    try {
      const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(input)}`);
      const { url, cp, category, count, note } = res.data;

      return api.sendMessage({
        body: `${cp}\n\n🎞️ ক্যাটাগরি: ${category}\n📦 মোট ভিডিও: ${count || "১"}${note ? `\nℹ️ নোট: ${note}` : ""}`,
        attachment: await global.utils.getStreamFromURL(url)
      }, threadID, messageID);
    } catch (err) {
      return api.sendMessage("❌ ভিডিও আনতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};

module.exports.reply = async function ({ api, event, reply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== reply.author) return;

  const number = parseInt(body);
  const categories = reply.categories;

  if (isNaN(number) || number < 1 || number > categories.length)
    return api.sendMessage("⚠️ ১ থেকে ১৫ এর মধ্যে একটি সঠিক সংখ্যা দিন।", threadID, messageID);

  const category = categories[number - 1];
  const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
  const Shaon = apis.data.api;

  try {
    const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(category)}`);
    const { url, cp, count } = res.data;

    return api.sendMessage({
      body: `${cp}\n\n🎞️ ক্যাটাগরি: ${category}\n📦 মোট ভিডিও: ${count || "১"}`,
      attachment: await global.utils.getStreamFromURL(url)
    }, threadID, messageID);
  } catch (err) {
    return api.sendMessage("❌ ভিডিও আনতে সমস্যা হয়েছে।", threadID, messageID);
  }
};
