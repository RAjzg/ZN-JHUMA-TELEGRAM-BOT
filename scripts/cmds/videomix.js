module.exports.config = {
  name: "videomix",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat",
  prefix: true,
  description: "videomix love story video",
  category: "video",
  usages: "videomix",
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
`${video}/video/status`,
`${video}/video/sad`,
`${video}/video/baby`,
`${video}/video/love`,
`${video}/video/ff`,
`${video}/video/shairi`,
`${video}/video/humaiyun`,
`${video}/video/kosto`,
`${video}/video/anime`,
`${video}/video/short`,
`${video}/video/event`,
`${video}/video/prefix`,
`${video}/video/cpl`,
`${video}/video/time`,
`${video}/video/lofi`,
`${video}/video/happy`,
`${video}/video/football`,               
`${video}/video/funny`,
`${video}/video/sex`,
`${video}/video/hot`,
`${video}/video/item`,
`${video}/video/capcut`,
`${video}/video/sex2`,
`${video}/video/sex3`,
`${video}/video/horny`
               ];
  var shaon1 = shaon[Math.floor(Math.random() * shaon.length)];
  const res = await axios.get(shaon1);
  const vidUrl = res.data.url;
  const vid = await axios.get(vidUrl, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozila/5.0" },
  });
  const filep = __dirname + "/caches/video.mp4";
  fs.writeFileSync(filep, Buffer.from(vid.data,"utf-8"));
  message.stream({
    url: fs.createReadStream(filep),
    caption: `𝐒𝐏𝐀𝐘𝐒𝐇𝐄𝐀𝐋 𝐑𝐀𝐍𝐃𝐎𝐌 𝐌𝐈𝐗 
${res.data.shaon}\n𝚃𝙾𝚃𝙰𝙻 𝚅𝙸𝙳𝙴𝙾:${res.data.count}...🎬\n\n｢𝐒𝐇𝐀𝐎𝐍 𝐏𝐑𝐎𝐉𝐄𝐂𝐓｣`,
  });
  //fs.unlinkSync(filep);
} catch(e){
message.reply(e.message)
}
};
