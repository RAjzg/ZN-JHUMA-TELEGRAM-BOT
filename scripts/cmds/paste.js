const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "pastebin",
  version: "1.0",
  aliases: ["bin"],
  role: 2,
  description: "Upload local command files to a pastebin service.",
  author: "Shaon Ahmed",
  prefix: true,
  category: "Utility",
  cooldown: 5,
  guide: "{pn} <filename> - The file must be located in the 'cmds' folder."
};

module.exports.run = async ({ message, args }) => {
  if (args.length === 0) {
    return message.reply('📁 Please provide the filename to upload.\nUsage: `!pastebin1 <filename>`');
  }

  const fileName = args[0];
  const cmdsFolderPath = path.join(__dirname, '..', 'cmds');

  const filePathWithoutExt = path.join(cmdsFolderPath, fileName);
  const filePathWithExt = path.join(cmdsFolderPath, fileName + '.js');

  let filePath;

  if (fs.existsSync(filePathWithoutExt)) {
    filePath = filePathWithoutExt;
  } else if (fs.existsSync(filePathWithExt)) {
    filePath = filePathWithExt;
  } else {
    return message.reply('❌ File not found in the `cmds` folder.');
  }

  fs.readFile(filePath, 'utf8', async (err, fileData) => {
    if (err) {
      console.error("Read error:", err);
      return message.reply('❗ Error while reading the file.');
    }

    try {
      await message.reply("📤 Uploading file to PasteBin, please wait...");

      const apiBase = 'https://pastebin-30pq.onrender.com';

      const res = await axios.post(`${apiBase}/paste`, {
        text: fileData
      });

      if (res.data && res.data.id) {
        const finalUrl = `${apiBase}/paste/${res.data.id}`;
        return message.reply(`✅ File uploaded successfully:\n🔗 ${finalUrl}`);
      } else {
        return message.reply('⚠️ Upload failed. Please try again later.');
      }

    } catch (error) {
      console.error("Upload error:", error.message);
      return message.reply('❌ Failed to upload the file to pastebin.');
    }
  });
};
