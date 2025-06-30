const axios = require("axios");

const API_URL = "https://web-api-delta.vercel.app";

module.exports.config = {
    name: "song",
    version: "1.0.0",
    aliases: ["play", "music"],
    author: "Dipto",
    countDown: 5,
    role: 0,
    description: "Search and download audio from YouTube",
    category: "media",
    guide: "{pn} [song name or link]\nExample: {pn} despacito"
};

module.exports.run = async ({ api, args, event, message }) => {
    if (!args[0]) return message.reply("❌ Please provide a song name or YouTube link.");

    const checkurl = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/;
    const urlTest = checkurl.test(args[0]);

    if (urlTest) {
        const match = args[0].match(checkurl);
        const videoID = match[1];

        try {
            const { data } = await axios.get(`${API_URL}/ytmp3=${videoID}`);

            if (!data.url) return message.reply("❌ Failed to fetch download URL.");

            return message.stream({
                url: data.url,
                caption: `🎶 Title: ${data.title}`
            });

        } catch (e) {
            return message.reply("❌ Error: " + e.message);
        }
    } else {
        const keyword = args.join(" ");

        try {
            const res = await axios.get(`${API_URL}/yt?q=${encodeURIComponent(keyword)}`);
            const results = res.data.results.slice(0, 6);

            if (!results.length) return message.reply("❌ No results found.");

            let msg = "🎧 Search Results:\n\n";
            let count = 1;
            for (const item of results) {
                msg += `${count++}. ${item.video.title}\nDuration: ${item.video.duration}\nChannel: ${item.channel.name}\n\n`;
            }

            const sent = await message.reply(msg + "👉 Reply with the number to download.");
            global.functions.reply.set(sent.message_id, {
                commandName: "song",
                messageID: sent.message_id,
                results
            });

        } catch (e) {
            return message.reply("❌ Error fetching search results.");
        }
    }
};

module.exports.reply = async ({ event, Reply, message }) => {
    const { results } = Reply;
    const choice = parseInt(event.text);

    if (isNaN(choice) || choice < 1 || choice > results.length) {
        return message.reply("❌ Invalid choice. Please enter a valid number.");
    }

    const selected = results[choice - 1];
    const videoID = selected.video.id;

    try {
        const { data } = await axios.get(`${API_URL}/ytmp3=${videoID}`);

        if (!data.url) return message.reply("❌ Failed to fetch download URL.");

        await message.unsend(Reply.messageID);

        return message.stream({
            url: data.url,
            caption: `🎶 Title: ${data.title}`
        });

    } catch (e) {
        return message.reply("❌ Error downloading: " + e.message);
    }
};
