const axios = require('axios');

module.exports.config = {
  name: "up",
  version: "1.0.3",
  role: 0,
  credits: "Islamick Cyber Chat",
  usePrefix: true,
  description: "Uptime robot uptime monitor: create, delete, status, list with name + url",
  category: "uptime",
  usages: "up [name] [url] | up delete [id] | up status [id] | up list",
  cooldowns: 30,
};

module.exports.onStart = async ({ message, args }) => {
  try {
    const apiLink = "https://web-api-delta.vercel.app/upt"; // 🟩 তোমার API URL

    if (!args.length) {
      return message.reply(
        `📍 কমান্ড ব্যবহারের নির্দেশনা:\n\n` +
        `✅ মনিটর তৈরি: up [name] [url]\n` +
        `🗑️ মনিটর মুছে ফেলুন: up delete [id]\n` +
        `📊 মনিটরের অবস্থা: up status [id]\n` +
        `📜 সব মনিটর দেখুন: up list\n\n` +
        `উদাহরণ:\n` +
        `up Shaon https://example.com\n` +
        `up delete 123456\n` +
        `up status 123456\n` +
        `up list`
      );
    }

    const command = args[0].toLowerCase();

    // 🗑️ Delete Command
    if (command === "delete") {
      const id = args[1];
      if (!id) return message.reply("❌ দয়া করে মনিটরের ID দিন।\nব্যবহার: up delete <id>");

      const res = await axios.get(`${apiLink}?delete&id=${encodeURIComponent(id)}`);
      if (res.data.success) {
        return message.reply(`🗑️ ${res.data.message}`);
      } else {
        return message.reply(`❌ ত্রুটি ঘটেছে:\n${res.data.error || JSON.stringify(res.data)}`);
      }
    }

    // 📊 Status Command
    if (command === "status") {
      const id = args[1];
      if (!id) return message.reply("❌ দয়া করে মনিটরের ID দিন।\nব্যবহার: up status <id>");

      const res = await axios.get(`${apiLink}?status&id=${encodeURIComponent(id)}`);

      if (res.data.success && res.data.data) {
        const data = res.data.data;
        let statusText = "Unknown";
        switch(data.status) {
          case 0: statusText = "Paused"; break;
          case 1: statusText = "Not Checked Yet"; break;
          case 2: statusText = "Up"; break;
          case 8: statusText = "Seems Down"; break;
          case 9: statusText = "Down"; break;
        }

        return message.reply(
          `📊 মনিটরের অবস্থা:\n` +
          `🆔 আইডি: ${data.id}\n` +
          `🌐 নাম: ${data.name}\n` +
          `🔗 URL: ${data.url}\n` +
          `⏰ ইন্টারভ্যাল: ${data.interval} মিনিট\n` +
          `📶 স্ট্যাটাস: ${statusText} (${data.status})`
        );
      } else {
        return message.reply(`❌ ত্রুটি ঘটেছে:\n${res.data.error || JSON.stringify(res.data)}`);
      }
    }

    // 📜 List Command
    if (command === "list") {
      const res = await axios.get(`${apiLink}?list=true`);
      const list = res.data.monitors;

      if (!list || !list.length) {
        return message.reply("❌ কোনো মনিটর পাওয়া যায়নি।");
      }

      const output = list
        .map(
          (item, index) =>
            `${index + 1}. 🌐 ${item.friendly_name || item.name}\n` +
            `🔗 ${item.url}\n` +
            `🆔 আইডি: ${item.id}\n` +
            `📶 স্ট্যাটাস: ${item.status}\n`
        )
        .join("\n");

      return message.reply(`📜 সব মনিটর:\n\n${output}`);
    }

    // ✅ Create Command (name + url)
    // এখানে প্রথম আর্গুমেন্ট নাম, বাকি সব URL
    if (command !== "delete" && command !== "status" && command !== "list") {
      const monitorName = args[0];
      const url = args.slice(1).join(" ").trim();

      if (!url.startsWith("http")) {
        return message.reply("❌ দয়া করে সঠিক URL দিন।\nব্যবহার: up <name> <url>");
      }

      const res = await axios.get(`${apiLink}?url=${encodeURIComponent(url)}&name=${encodeURIComponent(monitorName)}`);

      if (res.data.success && res.data.data) {
        const data = res.data.data;
        let statusText = "Unknown";
        switch(data.status) {
          case 0: statusText = "Paused"; break;
          case 1: statusText = "Not Checked Yet"; break;
          case 2: statusText = "Up"; break;
          case 8: statusText = "Seems Down"; break;
          case 9: statusText = "Down"; break;
        }

        return message.reply(
          `✅ মনিটর সফলভাবে তৈরি হয়েছে!\n` +
          `🆔 আইডি: ${data.id}\n` +
          `🌐 নাম: ${data.name}\n` +
          `🔗 URL: ${data.url}\n` +
          `⏰ ইন্টারভ্যাল: ${data.interval} মিনিট\n` +
          `📶 স্ট্যাটাস: ${statusText} (${data.status})`
        );
      } else {
        return message.reply(`❌ ত্রুটি ঘটেছে:\n${res.data.error || JSON.stringify(res.data)}`);
      }
    }

  } catch (e) {
    console.error(e);
    return message.reply(`❌ ত্রুটি: ${e.message}`);
  }
};
