const request = require("request");
const fs = require("fs");
  
module.exports.config = {
  name: "rndm",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat",
  prefix: true,
  description: "random love story video",
  category: "video",
  usages: "random",
  cooldowns: 30,
};

module.exports.run = async function ({ event, args, api, message }) {
try{
  const axios = require("axios");
  const nameParam = args.join("");
  if (!args[0]) message.reply('[ ! ] Input Name.\nEx: /rndm Shaon')
  
  const { data } = await axios.get(
    "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json",
  );
  const video = data.api;
  const res = await axios.get(`${video}/video/random?name=${encodeURIComponent(nameParam)}`);
  
   const vidUrl = res.data.url;
  const vid = await axios.get(vidUrl, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozila/5.0" },
  });
  const filep = __dirname + "/caches/video.mp4";
  fs.writeFileSync(filep, Buffer.from(vid.data,"utf-8"));
  message.stream({
    url: fs.createReadStream(filep),
    caption: `${res.data.cp}\n\n𝐓𝐨𝐭𝐚𝐥 𝐕𝐢𝐝𝐞𝐨𝐬: [${res.data.count}]\n𝐀𝐝𝐝𝐞𝐝 𝐓𝐡𝐢𝐬 𝐕𝐢𝐝𝐞𝐨 𝐓𝐨 𝐓𝐡𝐞 𝐀𝐩𝐢 𝐁𝐲 [${res.data.name}]`,
  });
  //fs.unlinkSync(filep);
} catch(e){
message.reply(e.message)
}
};
