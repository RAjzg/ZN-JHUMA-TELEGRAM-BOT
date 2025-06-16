const axios = require("axios");
const path = require("path");
const fs = require("fs");

module.exports.config = {  
    name: "pic",
    version: "0.0.1",
    aliases: ["pin"],
    role: 0,  
    description: "This command allows you to search for images on Pinterest based on a given query and fetch a specified number of images (1-50).",
    author: "Shaon Ahmed",
    prefix: true,
    category: "media",
    type: "anyone",
    cooldown: 20,
    guide: "{pn} <search query> - <number of images>\nExample: {pn} cat - 10"
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.run = async ({ bot, message, msg, args, chatId }) => {
  try {
    const keySearch = args.join(" ");

    if (!keySearch.includes("-")) {
      return message.reply(
        'Please enter in the format: "keyword - number". Example: pinterest Naruto - 10'
      );
    }

    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const Shaon = apis.data.noobs;
        
    const [searchQuery, numImagesStr] = keySearch.split("-").map(s => s.trim());
    let numberSearch = parseInt(numImagesStr);

    if (!searchQuery) {
      return message.reply("Please provide a search query.");
    }

    if (isNaN(numberSearch) || numberSearch < 1) {
      numberSearch = 6;
    }
    if (numberSearch > 50) {
      numberSearch = 50;
      await message.reply("Limiting the number of images to 50 to prevent overload.");
    }

    const apiUrl = `${Shaon}/pinterest?search=${encodeURIComponent(searchQuery)}&count=${numberSearch}`;

    const res = await axios.get(apiUrl);
    const data = res.data.data;

    if (!data || data.length === 0) {
      return message.reply(`No images found for "${searchQuery}".`);
    }

    const imgData = [];
    const cacheDir = path.join(__dirname, "caches", msg.message_id.toString());

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const downloadPromises = [];
    for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
      const imageUrl = data[i];
      const imgPath = path.join(cacheDir, `${i + 1}.jpg`);
      downloadPromises.push(
        axios.get(imageUrl, {
          responseType: "arraybuffer",
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
        .then(imgResponse => fs.promises.writeFile(imgPath, imgResponse.data, 'binary'))
        .then(() => imgData.push(imgPath))
        .catch(error => console.error(`Error downloading image ${imageUrl}:`, error.message))
      );
    }
    await Promise.allSettled(downloadPromises);

    if (imgData.length === 0) {
      return message.reply("Failed to download any images. Please try again later.");
    }

    // এখন 10 টার ব্যাচে ভাগ করে পাঠাবো, মাঝে 5 সেকেন্ড ডিলে
    const BATCH_SIZE = 10;
    for (let i = 0; i < imgData.length; i += BATCH_SIZE) {
      const batch = imgData.slice(i, i + BATCH_SIZE);
      const mediaAttachments = batch.map(imgPath => ({
        type: 'photo',
        media: fs.createReadStream(imgPath),
      }));

      await bot.sendMediaGroup(chatId, mediaAttachments, {
        caption: i === 0 ? `Here are ${imgData.length} Pinterest results for "${searchQuery}"` : undefined,
        reply_to_message_id: msg.message_id
      });

      // যদি শেষ ব্যাচ না হয়, ডিলে দাও
      if (i + BATCH_SIZE < imgData.length) {
        await delay(5000); // 5 সেকেন্ড বিরতি
      }
    }

  } catch (error) {
    console.error(`Error in Pinterest command:`, error);
    return message.reply(`An error occurred while fetching images: ${error.message}`);
  } finally {
    const currentCacheDir = path.join(__dirname, "caches", msg.message_id.toString());
    if (fs.existsSync(currentCacheDir)) {
      await fs.promises.rm(currentCacheDir, { recursive: true, force: true }).catch(console.error);
    }
  }
}
