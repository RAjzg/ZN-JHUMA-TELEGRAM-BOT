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

        const imgData = await Promise.all(
            data.slice(0, numberSearch).map(async (url) => {
                const imageBuffer = (await axios.get(url, { responseType: "arraybuffer" })).data;
                return { attachment: Buffer.from(imageBuffer), name: "image.jpg" };
            })
        );

        await message.stream({
            attachment: data[0],
            caption: `${imgData.length} search results for keyword: ${keySearchs}`,
        });

    } catch (error) {
        console.error(error);
        return message.reply("An error occurred while fetching images. Please try again later.");
    }
};
