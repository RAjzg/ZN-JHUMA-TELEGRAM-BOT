const fs = require('fs');
const path = require('path');
const axios = require('axios');
const vm = require('vm');

module.exports.config = {
  name: "cmd",
  version: "2.0.0",
  role: 2,
  credits: "Shaon + chatgpt",
  description: "Create, load, or load all .js files with syntax check",
  commandCategory: "utility",
  usages: "[create filename code/link] | [load filename] | [loadall]",
  cooldowns: 5
};

module.exports.run = async ({ message, args }) => {
  const action = args[0];
  const target = args[1];
  const input = args.slice(2).join(' ');
  const basePath = __dirname;

  // Function to load a file
  const loadFile = (filePath) => {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const context = vm.createContext({ console, require, module, __dirname, __filename, process });
      const script = new vm.Script(code);
      script.runInContext(context);
      return true;
    } catch (err) {
      console.error(`Failed to load ${filePath}:`, err.message);
      return false;
    }
  };

  // ============================
  // create <filename> <code/url>
  // ============================
  if (action === 'create') {
    if (!target || !input) return message.reply("Usage: cmd create <filename> <code or url>");

    let code;
    const isURL = /^(http|https):\/\/[^ "]+$/;

    try {
      if (isURL.test(input)) {
        const res = await axios.get(input);
        code = res.data;
      } else {
        code = input;
      }

      // Syntax Check
      new vm.Script(code);

      const filePath = path.join(basePath, target);
      fs.writeFileSync(filePath, code, 'utf-8');
      return message.reply(`✅ File created: ${target}`);
    } catch (err) {
      return message.reply(`❌ Error: ${err.message}`);
    }
  }

  // ======================
  // load <filename>
  // ======================
  if (action === 'load') {
    if (!target) return message.reply("Usage: cmd load <filename>");

    const filePath = path.join(basePath, target);
    if (!fs.existsSync(filePath)) return message.reply("❌ File not found.");

    const success = loadFile(filePath);
    return message.reply(success ? `✅ Loaded: ${target}` : `❌ Failed to load: ${target}`);
  }

  // ======================
  // loadall
  // ======================
  if (action === 'loadall') {
    const files = fs.readdirSync(basePath).filter(f => f.endsWith('.js') && f !== path.basename(__filename));

    let loaded = 0;
    for (const file of files) {
      const filePath = path.join(basePath, file);
      if (loadFile(filePath)) loaded++;
    }

    return message.reply(`✅ Loaded ${loaded}/${files.length} .js files.`);
  }

  return message.reply("Invalid usage. Use: cmd create/load/loadall");
};
