const axios = require('axios');
const fs = require('fs');
const apiBase = 'https://ytdl.up.railway.app';

const MAX_FILE_SIZE = 25692000; // 26MB

module.exports.config = {
    name: "song",
    version: "3.0.0",
    aliases: [],
    author: "Shaon Ahmed",
    countDown: 5,
    role: 0,
    description: "Download audio from YouTube",
    category: "media",
    guide: "{pn} <song name | youtube link>"
};

module.exports.run = async ({ api, args, event, commandName, message }) => {
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    let videoID;
    const urlCheck = checkurl.test(args[0]);

    if (urlCheck) {
        const match = args[0].match(checkurl);
        videoID = match ? match[1] : null;

        try {
            const { data } = await axios.get(`${apiBase}/ytmp3?url=https://www.youtube.com/watch?v=${videoID}`);
            await message.stream({
                url: await downloadFile(data.download_url, 'audio.mp3'),
                caption: data.title
            });
        } catch (err) {
            return message.reply(`❌ Failed: ${err.message}`);
        }
        return;
    }

    const keyword = args.join(" ");
    if (!keyword) return message.reply("❌ Please provide a song name or YouTube link.");

    try {
        const { data } = await axios.get(`${apiBase}/youtube?q=${encodeURIComponent(keyword)}`);
        if (!data.status) return message.reply("❌ Search failed.");

        const result = data.results.slice(0, 6);
        if (result.length === 0) return message.reply(`⭕ No results found for "${keyword}"`);

        let msg = "";
        result.forEach((item, index) => {
            msg += `${index + 1}. ${item.title}\n⏱️ Duration: ${item.duration}\n👤 Channel: ${item.channel.name}\n\n`;
        });

        const info = await message.reply(msg + "💡 Reply this message with the number to download.");
        const replyID = info.message_id;

        global.functions.reply.set(replyID, {
            commandName: 'song',
            messageID: replyID,
            result
        });

    } catch (e) {
        message.reply("❌ Error occurred: " + e.message);
    }
};

module.exports.reply = async ({ event, api, Reply, message }) => {
    try {
        const { result } = Reply;
        const choice = parseInt(event.text);
        if (isNaN(choice) || choice < 1 || choice > result.length) {
            return message.reply("❌ Invalid choice. Please reply with a number between 1 and 6.");
        }

        const infoChoice = result[choice - 1];
        const videoID = infoChoice.id;

        const { data } = await axios.get(`${apiBase}/ytmp3?url=https://www.youtube.com/watch?v=${videoID}`);
        await message.unsend(Reply.messageID);

        await message.stream({
            url: await downloadFile(data.download_url, 'audio.mp3'),
            caption: `🎶 Title: ${data.title}\n🔊 Quality: ${data.quality}`
        });

        fs.unlinkSync('audio.mp3');

    } catch (error) {
        console.log(error);
        message.reply("⭕ Failed! File is larger than 26MB or another issue occurred.");
    }
};

async function downloadFile(url, filename) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filename, Buffer.from(response.data));

    const stats = fs.statSync(filename);
    if (stats.size > MAX_FILE_SIZE) {
        fs.unlinkSync(filename);
        throw new Error('File size exceeds 26MB limit.');
    }

    return fs.createReadStream(filename);
}
