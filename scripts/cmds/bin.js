const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "pastebin",
  version: "1.0",
  aliases: ["bin"],
  role: 0,
  description: "Upload local command files to a pastebin service.",
  author: "ArYAN",
  prefix: true,
  category: "Utility",
  type: "admin",
  cooldown: 5,
  guide: "{pn} <filename> - The file must be located in the 'commands' folder."
};

module.exports.run = async ({ bot, message, msg, args, userId }) => {
  if (args.length === 0) {
    return message.reply('Please provide the filename to upload. Usage: `!pastebin <filename>`');
  }

  const isAdmin = global.settings.admin.includes(String(userId));
  if (!isAdmin) {
    return message.reply("❌ | Only VIP admin users can use this command.");
  }

  const fileName = args[0];
  const commandsFolderPath = path.join(__dirname, '..', 'commands'); 
  const filePathWithoutExtension = path.join(commandsFolderPath, fileName);
  const filePathWithExtension = path.join(commandsFolderPath, fileName + '.js');

  let filePath;

  if (fs.existsSync(filePathWithoutExtension)) {
    filePath = filePathWithoutExtension;
  } else if (fs.existsSync(filePathWithExtension)) {
    filePath = filePathWithExtension;
  } else {
    return message.reply('Invalid command or file not found in the `commands` folder.');
  }

  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      console.error("Error reading file for pastebin:", err);
      return message.reply('An error occurred while reading the file.');
    }

    try {
      await message.reply("Uploading file to pastebin, please wait...");
      const response = await axios.post('https://xyz-aryan-noobx.onrender.com/v1/paste', { code: data });

      if (response.data && response.data.link) {
        const link = response.data.link;
        message.reply(`✅ File uploaded successfully:\n${link}`);
      } else {
        message.reply('Failed to upload the command to pastebin. Please try again later.');
      }
    } catch (uploadErr) {
      console.error("Error uploading to pastebin:", uploadErr);
      message.reply('An error occurred while uploading the command to pastebin.');
    }
  });
}
