const axios = require("axios");

module.exports.config = {
  name: "flux",
  version: "2.0",
  role: 0,
  author: "Dipto",
  description: "Flux Image Generator",
  category: "𝗜𝗠𝗔𝗚𝗘 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥",
  premium: true,
  guide: "{pn} [prompt] --ratio 1024x1024\n{pn} [prompt]",
  countDown: 15,
};

module.exports.onStart = async ({ event, args, message }) => {
  const dipto = "https://www.noobs-api.rf.gd/dipto";

  try {
    const prompt = args.join(" ");
    const [prompt2, ratio = "1:1"] = prompt.includes("--ratio")
      ? prompt.split("--ratio").map(s => s.trim())
      : [prompt, "1:1"];

    const startTime = Date.now();

    const waitMessage = await message.reply("Generating image, please wait... 😘");
  //  api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const apiurl = `${dipto}/flux?prompt=${encodeURIComponent(prompt2)}&ratio=${encodeURIComponent(ratio)}`;
//    const response = await axios.get(apiurl, { responseType: "stream" });

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

 //   message.react("✅");
    message.unsend(waitMessage.message_id);

    message.stream({ url:apiurl, caption: `✅ | Here's your image\nGenerated in ${timeTaken} seconds`});

  } catch (e) {
    console.error(e);
    message.reply("Error: " + e.message);
  }
};
