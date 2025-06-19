const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "help",
  version: "1.0",
  author: "Dipto",
  role: 0,
  usePrefix: true,
  description: "List all commands",
  commandCategory: "system",
  guide: "{p}help",
  coolDowns: 5,
  premium: false
};

module.exports.run = async ({ event, args, message, threadsData }) => {
  // কমান্ড ফাইলগুলো লোড করবো cmds ফোল্ডার থেকে
  const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'cmds'))
                         .filter(file => file.endsWith('.js'));

  const config = require('../../config.json');

  // থ্রেড থেকে prefix নেবো (নাহলে ডিফল্ট '/')
  const thread = await threadsData.getThread(event.chat.id);
  const prefix = thread?.prefix || '/';

  // ক্যাটাগরি অনুযায়ী কমান্ডগুলো গ্রুপ করবো
  let categories = {};
  let totalCommands = 0;

  for (const file of commandFiles) {
    const command = require(path.join(__dirname, '..', 'cmds', file));
    if (command.config) {
      const category = command.config.commandCategory || command.config.category || 'OTHER';
      if (!categories[category]) categories[category] = [];
      categories[category].push(command.config);
      totalCommands++;
    }
  }

  // যদি ইউজার স্পেসিফিক কিছু সার্চ বা ইনফরমেশন চায়
  if (args[0]) {
    // ১) সার্চ শুরু হওয়ার কমান্ড লিস্ট -s <letter>
    if (args[0] === '-s' && args[1]) {
      const searchLetter = args[1].toLowerCase();
      const matchingCommands = Object.values(categories).flat()
                                 .filter(cmd => cmd.name.startsWith(searchLetter));

      if (matchingCommands.length === 0) {
        return message.reply(`No commands found starting with '${searchLetter}'.`);
      }

      let searchMessage = `✨ [ Commands Starting with '${searchLetter.toUpperCase()}' ] ✨\n\n`;
      matchingCommands.forEach(cmd => {
        searchMessage += `✧ ${cmd.name}\n`;
      });
      return message.reply(searchMessage);
    }

    // ২) নির্দিষ্ট কমান্ডের ডিটেইলস দেখানো
    const commandName = args[0].toLowerCase();
    const command = Object.values(categories).flat()
                     .find(cmd => cmd.name === commandName || cmd.aliases?.includes(commandName));

    if (!command) {
      return message.reply('Command not found.');
    }

    // কমান্ডের গাইড (usage) - প্যারামিটার রিপ্লেস করা হয় prefix দিয়ে
    let guide = command?.guide || command?.usages || 'No usage available';
    guide = guide.replace(/{pn}|{pm}|{p}|{prefix}|{name}/g, prefix + command?.name);

    // যদি ইউজার usage জানতে চায়
    if (args[1] === '-u') {
      return message.reply(`📝 Usage for ${command.name}: ${guide}`);
    }

    // যদি ইউজার aliases জানতে চায়
    if (args[1] === '-a') {
      const aliases = command.aliases ? command.aliases.join(', ') : 'None';
      return message.reply(`🪶 [ Aliases for ${command.name} ]: ${aliases}`);
    }

    // সাধারণ কমান্ড ইনফরমেশন
    let commandInfo = `
╭──✦ [ Command: ${command.name.toUpperCase()} ]
├‣ 📜 Name: ${command.name}
├‣ 👤 Credits: ${command?.credits || command?.author || 'Unknown'}
├‣ 🔑 Permission: ${command.role === 0 ? 'Everyone' : 'Admin'}
├‣ 🪶 Aliases: ${command.aliases ? command.aliases.join(', ') : 'None'}
├‣ 📜 Description: ${command.description || 'No description'}
├‣ 📚 Guide: ${guide}
├‣ 🚩 Prefix Required: ${command.prefix || command.usePrefix ? 'Yes' : 'No'}
├‣ ⚜️ Premium: ${command.premium ? 'Yes' : 'No'}
╰───────────────◊`;

    return message.reply(commandInfo);
  }

  // যদি কোনো স্পেসিফিক কমান্ড না দিয়ে শুধু help ডাকা হয় (page 1 by default)
  const page = parseInt(args[0], 10) || 1;
  const categoryKeys = Object.keys(categories);
  const totalPages = 1; // তোমার দরকার অনুযায়ী পেজিনেশন করতে পারো

  // হেল্প মেসেজ তৈরি (সব ক্যাটাগরির কমান্ড দেখাবে)
  let helpMessage = `✨ [ Guide For Beginners - Page ${page} ] ✨\n\n`;

  for (const category of categoryKeys) {
    helpMessage += `╭──── [ ${category.toUpperCase()} ]\n`;
    helpMessage += `│ ✧${categories[category].map(cmd => cmd.name).join(' ✧ ')}\n`;
    helpMessage += `╰───────────────◊\n`;
  }

  helpMessage += `
╭─『 ${config.botName.toUpperCase()} BOT 』 
╰‣ Total commands: ${totalCommands}
╰‣ Page ${page} of ${totalPages}
╰‣ A personal Telegram bot ✨
╰‣ ADMIN: ${config.adminName}
`;

  return message.reply(helpMessage);
};
