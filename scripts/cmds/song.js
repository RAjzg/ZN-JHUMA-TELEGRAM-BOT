const axios = require("axios");
const fs = require('fs');

const API_BASE_URL = "https://web-api-delta.vercel.app";

const baseApiUrl = async () => API_BASE_URL;

module.exports.config = {
    name: "song",
    version: "2.1.0",
    aliases: [],
    author: "dipto",
    countDown: 5,
    role: 0,
    description: "Download audio from YouTube",
    category: "media",
    guide: "{pn} [<song name>|<song link>]:\n   Example:\n{pn} chipi chipi chapa chapa"
};

module.exports.run = async ({ api, args, event, commandName, message }) => {
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    let videoID;
    const urlYtb = checkurl.test(args[0]);

    if (urlYtb) {
        const match = args[0].match(checkurl);
        videoID = match ? match[1] : null;

        // mp3 ডাউনলোড API কল
        const { data } = await axios.get(`${await baseApiUrl()}/ytmp3=${videoID}`);

        if (!data.url) return message.reply("❌ Download URL not found");

        return message.stream({
            url: data.url,
            caption: data.title || 'Audio',
        });
    }

    // সার্চ API কল
    let keyWord = args.join(" ");
    keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;

    let result;
    try {
        const res = await axios.get(`${await baseApiUrl()}/yt?q=${encodeURIComponent(keyWord)}`);
        result = res.data.results.slice(0, 6); // সর্বোচ্চ ৬ ফলাফল
    } catch (err) {
        return message.reply("❌ An error occurred: " + err.message);
    }

    if (!result || result.length === 0)
        return message.reply("⭕ No search results match the keyword: " + keyWord);

    let msg = "";
    let i = 1;
    for (const info of result) {
        msg += `${i++}. ${info.video.title}\nDuration: ${info.video.duration}\nChannel: ${info.channel.name}\n\n`;
    }

    const info = await message.reply(msg + "Reply to this message with a number to listen");
    const ii = info.message_id;

    global.functions.reply.set(ii, {
        commandName: 'song',
        messageID: ii,
        result
    });
};

module.exports.reply = async ({ event, api, Reply, message }) => {
    try {
        const { result } = Reply;
        const choice = parseInt(event.text);
        if (!isNaN(choice) && choice <= result.length && choice > 0) {
            const infoChoice = result[choice - 1];
            const videoID = infoChoice.video.id;

            // mp3 ডাউনলোড API কল
            const { data } = await axios.get(`${await baseApiUrl()}/ytmp3=${videoID}`);

            if (!data.url) return message.reply("❌ Download URL not found");

            await message.unsend(Reply.messageID);

            await message.stream({
                url: data.url,
                caption: `• Title: ${data.title}\n• Quality: ${data.quality || 'N/A'}`
            });

        } else {
            message.reply("Invalid choice. Please enter a valid number.");
        }
    } catch (error) {
        console.log(error);
        message.reply("⭕ Sorry, audio size was less than 26MB or an error occurred.");
    }
};
