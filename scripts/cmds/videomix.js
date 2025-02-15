module.exports.config = {
  name: "videomix",
  version: "11.9.7",
  role: 0,
  credits: "Islamick Cyber Chat",
  prefix:true,
  description: "random love story video",
  category: "video",
  usages: "random",
  cooldowns: 30,
};

module.exports.run = async function({ api, message }) {
  const axios = require('axios');
  const request = require('request');
  const fs = require("fs");
  const {data} = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json')
  const video = data.api3;
  var shaon = [`${video}/status`,
`${video}/sad`,
`${video}/baby`,
`${video}/love`,
`${video}/ff`,
`${video}/shairi`,
`${video}/humaiyun`,
`${video}/kosto`,
`${video}/anime`,
`${video}/short`,
`${video}/event`,
`${video}/prefix`,
`${video}/cpl`,
`${video}/time`,
`${video}/lofi`,
`${video}/happy`,
`${video}/football`,               
`${video}/funny`,
`${video}/sex`,
               `${video}/hot`,
               `${video}/item`,
               `${video}/capcut`,
               `${video}/sex2`,
               `${video}/sex3`,
               `${video}/horny`,
               
]
  var shaon1 = shaon[Math.floor(Math.random() * shaon.length)]
  axios.get(shaon1).then(res => {
message.stream({
url: res.data.url,
caption: `𝐒𝐏𝐀𝐘𝐒𝐇𝐄𝐀𝐋 𝐑𝐀𝐍𝐃𝐎𝐌 𝐌𝐈𝐗🎬\n\n｢𝐒𝐇𝐀𝐎𝐍 𝐏𝐑𝐎𝐉𝐄𝐂𝐓｣`
});
      })
}
