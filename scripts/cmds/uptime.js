const os = require('os');
const process = require('process');
const { formatDuration } = require('date-fns'); 

module.exports = {
    config: {
        name: "uptime",
        aliases:["upt","up"],
        author: "dipto",
        description: "Get system and bot uptime information",
        commandCategory: "utility",
        usage: "uptime",
        usePrefix: true,
        role: 0,
    },
    onStart: async ({ message, usersData, threadsData }) => {
        try {
            // Get current time (Bangladesh Time - GMT+6)
            const now = new Date();
            const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // GMT+6 offset
            const nowTime = bangladeshTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            // System uptime calculation
            const sysUptimeSec = os.uptime();
            const systemUptime = formatDuration({
                days: Math.floor(sysUptimeSec / (3600 * 24)),
                hours: Math.floor((sysUptimeSec % (3600 * 24)) / 3600),
                minutes: Math.floor((sysUptimeSec % 3600) / 60),
                seconds: Math.floor(sysUptimeSec % 60)
            });

            // Process uptime calculation
            const procUptimeSec = process.uptime();
            const processUptime = formatDuration({
                days: Math.floor(procUptimeSec / (3600 * 24)),
                hours: Math.floor((procUptimeSec % (3600 * 24)) / 3600),
                minutes: Math.floor((procUptimeSec % 3600) / 60),
                seconds: Math.floor(procUptimeSec % 60)
            });

            const systemInfo = {
                os: os.type() + " " + os.release(),
                cores: os.cpus().length,
                architecture: os.arch(),
                totalMemory: (os.totalmem() / (1024 ** 3)).toFixed(2) + " GB",
                freeMemory: (os.freemem() / (1024 ** 3)).toFixed(2) + " GB",
                ramUsage: ((os.totalmem() - os.freemem()) / (1024 ** 2)).toFixed(2) + " MB",
            };

            const totalUsers = await usersData.getAllUsers().then(users => users.length);
            const totalThreads = await threadsData.getAllThreads().then(threads => threads.length);

            const uptimeMessage = `
╭──✦ [ ⏰ এখন বাংলাদেশে ]
├‣ 🕰 সময়: ${nowTime}

╭──✦ [ Uptime Information ]
├‣ 🕒 System Uptime: ${systemUptime}
╰‣ ⏱ Process Uptime: ${processUptime}

╭──✦ [ System Information ]
├‣ 📡 OS: ${systemInfo.os}
├‣ 🛡 Cores: ${systemInfo.cores}
├‣ 🔍 Architecture: ${systemInfo.architecture}
├‣ 🖥 Node Version: ${process.version}
├‣ 📈 Total Memory: ${systemInfo.totalMemory}
├‣ 📉 Free Memory: ${systemInfo.freeMemory}
├‣ 📊 RAM Usage: ${systemInfo.ramUsage}
├‣ 👥 Total Users: ${totalUsers} members
╰‣ 📂 Total Threads: ${totalThreads} Groups`;

            await message.reply(uptimeMessage);
        } catch (err) {
            await message.reply(`❌ | Error occurred: ${err.message}`);
        }
    }
};
