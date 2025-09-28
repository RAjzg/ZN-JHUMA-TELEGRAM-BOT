module.exports.config = {
  name: "status",
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
  var shaon = [
`${video}/video/status2`,
    `${video}/video/status3`,
    `${video}/video/status4`,
    `${video}/video/status5`
               ];
  var shaon1 = shaon[Math.floor(Math.random() * shaon.length)];
  const res = await axios.get(shaon1);
  const vidUrl = res.data.url.url;
  const vid = await axios.get(vidUrl, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozila/5.0" },
  });
  const filep = __dirname + "/caches/video.mp4";
  fs.writeFileSync(filep, Buffer.from(vid.data,"utf-8"));
  message.stream({
    url: fs.createReadStream(filep),
    caption: `°\n\n__${res.data.url.title}\n\n🍂𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁 : 𝚂𝙷𝙰𝙾𝙽 𝙰𝙷𝙼𝙴𝙳...🌸`,
  });
  //fs.unlinkSync(filep);
} catch(e){
message.reply(e.message)
}
};
