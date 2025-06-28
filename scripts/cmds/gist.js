const fs = require('fs');
const axios = require('axios');

module.exports.config = {
  name: "gist",
  version: "6.9.0",
  role: 2,
  author: "Shaon",
  usePrefix: true,
  description: "Convert code into link",
  category: "convert",
  guide: "{p}gist [filename] or reply + [filename]",
  countDown: 1
};

module.exports.onStart = async function ({ message, event, args }) {
  const fileName = args[0];

  if (!fileName) {
    return message.reply(`❌ Please provide filename.\n\nExample:\n${global.prefix}gist hello`);
  }

  const path = `scripts/cmds/${fileName}.js`;

  try {
    let code = '';

    // যদি reply করা হয়, তাহলে reply এর content নিবে
    if (event.type === "message_reply") {
      code = event.reply_to_message?.text;
      if (!code) {
        return message.reply("❌ Reply message does not contain any text.");
      }
    } 
    // নাহলে scripts/cmds ফাইল থেকে কোড নিবে
    else {
      code = await fs.promises.readFile(path, 'utf-8');
    }

    // Request পাঠাবে তোমার API তে
    const response = await axios.get(`https://noobs-api-sable.vercel.app/gist`, {
      params: {
        filename: `${fileName}.js`,
        code: code,
        description: 'Uploaded via Bot',
        isPublic: true
      }
    });

    const data = response.data;

    if (data.success) {
      message.reply(`✅ Gist Created Successfully!\n\n📥 Raw URL:\n${data.raw_url}`);
    } else {
      message.reply("❌ Failed to create Gist. Check API.");
    }

  } catch (error) {
    console.error("❌ An error occurred:", error);
    message.reply("❌ Command not found or API error.");
  }
};
