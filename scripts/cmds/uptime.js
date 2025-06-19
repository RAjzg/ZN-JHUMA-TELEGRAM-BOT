const os = require('os');
const process = require('process');
const { createCanvas } = require('canvas');
const { PassThrough } = require('stream');

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "up"],
    author: "dipto",
    description: "Get system and bot uptime info as image",
    commandCategory: "utility",
    usage: "uptime",
    usePrefix: true,
    role: 0,
  },

  onStart: async ({ message }) => {
    try {
      const uptimeSec = os.uptime();
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = Math.floor(uptimeSec % 60);
      const ramUsed = (os.totalmem() - os.freemem()) / (1024 ** 2);
      const ramTotal = os.totalmem() / (1024 ** 2);
      const ramUsagePercent = ((ramUsed / ramTotal) * 100).toFixed(1);

      const canvas = createCanvas(1200, 700);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#0a141e";
      ctx.fillRect(0, 0, 1200, 700);

      ctx.font = "bold 50px Sans";
      ctx.fillStyle = "#00f0ff";
      ctx.fillText("xyz | 1.1.7", 80, 70);

      ctx.font = "24px Sans";
      const hostText = "HOST: e88c8ca4-cc55-47d7";
      const textWidth = ctx.measureText(hostText).width;
      const badgeX = 1200 - textWidth - 80;
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(badgeX - 20, 40, textWidth + 40, 40);
      ctx.fillStyle = "#000";
      ctx.fillText(hostText, badgeX, 68);

      const infos = [
        ["Uptime", `${hours}h ${minutes}m ${seconds}s`],
        ["CPU", `${os.cpus()[0].model} (${os.cpus().length} cores)`],
        ["RAM", `${ramUsed.toFixed(1)} MB / ${ramTotal.toFixed(1)} MB (${ramUsagePercent}%)`],
        ["Platform", `${os.platform()} (${os.arch()})`],
        ["Node.js", `${process.version}`],
        ["Hostname", os.hostname()]
      ];

      ctx.font = "bold 30px Sans";
      let startY = 140;
      infos.forEach(([label, value], i) => {
        ctx.fillStyle = "#00f0ff";
        ctx.fillText(`${label}`, 80, startY + i * 55);
        ctx.font = "26px Sans";
        ctx.fillStyle = "#fff";
        ctx.fillText(`: ${value}`, 320, startY + i * 55);
        ctx.font = "bold 30px Sans";
      });

      // Convert to Buffer and PassThrough stream
      const buffer = canvas.toBuffer("image/png");
      const stream = new PassThrough();
      stream.end(buffer);

      // Send stream with filename
      await message.stream(stream, "uptime.png");

    } catch (err) {
      await message.reply(`❌ | Error occurred: ${err.message}`);
    }
  }
};
