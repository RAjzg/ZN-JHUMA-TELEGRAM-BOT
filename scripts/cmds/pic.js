module.exports.config = {
    name: "pic",
    version: "1.0.1",
    role: 0,
    credits: "Joshua Sy (Modified by You)",
    description: "Image search",
    usePrefix: true,
    commandCategory: "Search",
    usages: "[Text] - [Number]",
    cooldowns: 0,
};

module.exports.onStart = async function ({ api, event, args, message }) {
    const axios = require("axios");

    const keySearch = args.join(" ");
    if (!keySearch.includes("-")) {
        return message.reply(
            'Please enter in the format: "keyword - number". Example: pinterest Naruto - 10'
        );
    }

    const keySearchs = keySearch.substring(0, keySearch.lastIndexOf("-")).trim();
    const numberSearch = parseInt(keySearch.split("-").pop().trim()) || 6;

    if (isNaN(numberSearch) || numberSearch <= 0) {
        return message.reply("Please provide a valid number for images.");
    }

    try {
        const res = await axios.get(
            `https://nn54l5-8888.csb.app/pinterest?search=${encodeURIComponent(keySearchs)}`
        );
        const data = res.data.data;

        if (!data || data.length === 0) {
            return message.reply("No images found for the given keyword.");
        }

        await message.stream({
            attachment: data[0] || "https://i.pinimg.com/originals/a5/05/a9/a505a99a9802e0e65f864aa7572ce995.jpg",
            caption: `${numberSearch} search results for keyword: ${keySearchs}`,
        });

    } catch (error) {
        console.error(error);
        return message.reply(error.message);
    }
};
