module.exports.config = {
    name: "pic",
    version: "1.0.0",
    role: 0,
    credits: "Joshua Sy",
    description: "Image search",
    usePrefix: true,
    commandCategory: "Search",
    usages: "[Text] - [Number]",
    cooldowns: 0,
};

module.exports.onStart = async function ({ api, event, args, message }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const keySearch = args.join(" ");
    if (!keySearch.includes("-")) {
        return message.reply(
            'Please enter in the format: "keyword - number". Example: pinterest Naruto - 10 (Number represents how many images you want to fetch).'
        );
    }
    const keySearchs = keySearch.substring(0, keySearch.lastIndexOf("-")).trim();
    const numberSearch = parseInt(keySearch.split("-").pop().trim()) || 6;

    if (isNaN(numberSearch) || numberSearch <= 0) {
        return message.reply("Please provide a valid number for the number of images.");
    }

    try {
        const res = await axios.get(
            `https://nn54l5-8888.csb.app/pinterest?search=${encodeURIComponent(keySearchs)}`
        );
        const data = res.data.data;
        if (!data || data.length === 0) {
            return message.reply("No images found for the given keyword.");
        }

        let imgData = [];
        for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
            const filePath = path.join(__dirname, `caches`, `image${i + 1}.jpg`);
            const imageBuffer = (await axios.get(data[i], { responseType: "arraybuffer" })).data;

   fs.writeFileSync(filePath, imageBuffer);
            imgData.push(fs.createReadStream(filePath));
        }
        await message.reply({
            attachment: imgData,
            body: `${numberSearch} search results for keyword: ${keySearchs}`,
        });

   imgData.forEach((_, index) => {
            const filePath = path.join(__dirname, `caches`, `image${index + 1}.jpg`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error(error);
        message.reply("An error occurred while fetching images. Please try again later.");
    }
};
