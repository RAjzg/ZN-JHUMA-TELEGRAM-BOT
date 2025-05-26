module.exports.config = {
  name: "random",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat",
  prefix: true,
  description: "random love story video",
  category: "video",
  usages: "random",
  cooldowns: 30,
};

module.exports.run = async function ({ api, message }) {
try{
  const axios = require("axios");
  const fs = require("fs");
  const { data } = await axios.get(
    "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json",
  );
  const video = data.api;
  var shaon = [`${video}/video/random`, `${video}/video/random`];
  var shaon1 = shaon[Math.floor(Math.random() * shaon.length)];
  const res = await axios.get(shaon1);
  const vidUrl = res.data.url;
  const vid = await axios.get(vidUrl, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozila/5.0" },
  });
  const filep = __dirname + "/cache/video.mp4";
  fs.writeFileSync(filep, vid.data);
  message.stream({
    url: fs.createReadStream(filep),
    caption: `${res.data.cp}\n\n𝐓𝐨𝐭𝐚𝐥 𝐕𝐢𝐝𝐞𝐨𝐬: [${res.data.count}]\n𝐀𝐝𝐝𝐞𝐝 𝐓𝐡𝐢𝐬 𝐕𝐢𝐝𝐞𝐨 𝐓𝐨 𝐓𝐡𝐞 𝐀𝐩𝐢 𝐁𝐲 [${res.data.name}]`,
  });
  fs.unlinkSync(filep);
} catch(e){
message.reply(e.message)
}
};
