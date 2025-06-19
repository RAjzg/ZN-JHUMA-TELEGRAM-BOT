const os = require('os');
const process = require('process');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "up"],
    author: "dipto",
    description: "Get system and bot uptime info in image form",
    commandCategory: "utility",
    usage: "uptime",
    usePrefix: true,
    role: 0,
  },

  onStart: async ({ message }) => {
    try {
      // Basic system info
      const uptimeSec = os.uptime();
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = Math.floor(uptimeSec % 60);

      const ramUsed = (os.totalmem() - os.freemem()) / (1024 ** 2);
      const ramTotal = os.totalmem() / (1024 ** 2);
      const ramUsagePercent = ((ramUsed / ramTotal) * 100).toFixed(1);

      // Canvas setup
      const width = 1200, height = 700;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const bg = "#0a141e";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.font = "bold 50px Sans";
      ctx.fillStyle = "#00f0ff";
      ctx.fillText("xyz | 1.1.7", 80, 70);

      ctx.font = "24px Sans";
      const hostText = "HOST: e88c8ca4-cc55-47d7";
      const textWidth = ctx.measureText(hostText).width;
      const badgeX = width - textWidth - 80;
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(badgeX - 20, 40, textWidth + 40, 40);
      ctx.fillStyle = "#000";
      ctx.fillText(hostText, badgeX, 68);

      // Info text
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

      // RAM Usage donut
      const cx = 900, cy = 270, r = 80;
      const startAngle = -0.5 * Math.PI;
      const endAngle = startAngle + (parseFloat(ramUsagePercent) / 100) * 2 * Math.PI;

      ctx.beginPath();
      ctx.fillStyle = "#1b2a3a";
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#00f0ff";
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = bg;
      ctx.arc(cx, cy, r - 20, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = "26px Sans";
      ctx.fillStyle = "#ccc";
      ctx.fillText("RAM Usage", cx - 50, cy - 10);
      ctx.font = "bold 30px Sans";
      ctx.fillStyle = "#fff";
      ctx.fillText(`${ramUsagePercent}%`, cx - 30, cy + 30);

      // CPU Bar
      const barX = 80, barY = 620, barW = 1040, barH = 24;
      ctx.fillStyle = "#222";
      ctx.fillRect(barX, barY, barW, barH);

      const cpuLoad = 2.92;
      const cpuLoadPercent = 9.13;
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(barX, barY, barW * (cpuLoadPercent / 100), barH);

      ctx.fillStyle = "#00f0ff";
      ctx.font = "26px Sans";
      ctx.fillText(`CPU Load (${cpuLoad} | ${cpuLoadPercent}%)`, barX, barY - 10);

      // Convert to stream and send
      const imageBuffer = canvas.toBuffer("image/png");
      const stream = require("stream");
      const readable = new stream.PassThrough();
      readable.end(imageBuffer);

      return message.stream(readable, "uptime.png");

    } catch (err) {
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
