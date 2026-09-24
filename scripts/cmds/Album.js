const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "album",
    version: "2.6.6",
    role: 0,
    author: "Shaon Ahmed",
    description: "Reply add via Imgur/Catbox and inline browser",
    category: "Media",
    countDown: 5,
  },

  onStart: async ({ api, event, args, bot }) => {
    const chatId = event.chat?.id || event.threadID;

    // =========================================================
    // /album add <category>
    // =========================================================
    if (args[0] === "add" && args[1]) {
      const category = args[1].toLowerCase();

      const file =
        event?.reply_to_message?.video ||
        event?.reply_to_message?.document ||
        event?.reply_to_message?.photo?.slice(-1)[0];

      if (!file || !file.file_id) {
        return api.sendMessage(
          chatId,
          "❗ ভিডিও বা ছবিতে রিপ্লাই দিয়ে `/album add <category>` দিন।"
        );
      }

      try {
        const fileLink = await api.getFileLink(file.file_id);

        const apis = await axios.get(
          "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
        );

        const imgur = apis.data.allapi;
        const base = apis.data.api;

        let finalUrl;

        const isVideo = !!event?.reply_to_message?.video;
        const duration =
          event?.reply_to_message?.video?.duration || 0;

        if (isVideo && duration > 60) {
          const catboxUpload = await axios.get(
            `${imgur}/catbox?url=${encodeURIComponent(fileLink)}`
          );

          finalUrl =
            catboxUpload.data.url ||
            catboxUpload.data.link;
        } else {
          const imgurRes = await axios.get(
            `${imgur}/imgur?url=${encodeURIComponent(fileLink)}`
          );

          finalUrl =
            imgurRes.data.link ||
            imgurRes.data.uploaded?.image;
        }

        if (!finalUrl) {
          throw new Error("Upload failed");
        }

        await axios.get(
          `${base}/video/${category}?add=${category}&url=${encodeURIComponent(
            finalUrl
          )}`
        );

        return api.sendMessage(
          chatId,
          `✅ Added to '${category.toUpperCase()}'\n🔗 ${finalUrl}`
        );
      } catch (e) {
        console.error("Add failed:", e.message);

        return api.sendMessage(
          chatId,
          `❌ Upload বা add করতে ব্যর্থ হয়েছে।\n${e.message}`
        );
      }
    }

    // =========================================================
    // CATEGORY BUTTONS
    // =========================================================
    const videoSelectionMarkup = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Love", callback_data: "/video/love" },
            { text: "CPL", callback_data: "/video/cpl" },
          ],
          [
            { text: "Short", callback_data: "/video/short" },
            { text: "Sad", callback_data: "/video/sad" },
          ],
          [
            { text: "Status", callback_data: "/video/status" },
            { text: "Status2", callback_data: "/video/status2" },
          ],
          [
            { text: "Status3", callback_data: "/video/status3" },
            { text: "Shairi", callback_data: "/video/shairi" },
          ],
          [
            { text: "Baby", callback_data: "/video/baby" },
            { text: "Anime", callback_data: "/video/anime" },
          ],
          [
            { text: "FF", callback_data: "/video/ff" },
            { text: "Lofi", callback_data: "/video/lofi" },
          ],
          [
            { text: "Happy", callback_data: "/video/happy" },
            { text: "Football", callback_data: "/video/football" },
          ],
          [
            { text: "Islam", callback_data: "/video/islam" },
            { text: "Humaiyun", callback_data: "/video/humaiyun" },
          ],
          [
            { text: "Capcut", callback_data: "/video/capcut" },
            { text: "Sex", callback_data: "/video/sex" },
          ],
          [
            { text: "Sex2", callback_data: "/video/sex2" },
            { text: "Sex3", callback_data: "/video/sex3" },
          ],
          [
            { text: "Horny", callback_data: "/video/horny" },
            { text: "Hot", callback_data: "/video/hot" },
          ],
          [
            { text: "Item", callback_data: "/video/item" },
            { text: "Random", callback_data: "/video/mixvideo" },
          ],
        ],
      },
    };

    const categoryMessage = await api.sendMessage(
      chatId,
      "🎬 Select a video category:",
      videoSelectionMarkup
    );

    // =========================================================
    // CALLBACK
    // =========================================================
    bot.once("callback_query", async (callbackQuery) => {
      const categoryEndpoint = callbackQuery.data;

      await api.answerCallbackQuery(callbackQuery.id);

      const loading = await api.sendMessage(
        chatId,
        "⏳ Fetching video..."
      );

      try {
        await api.deleteMessage(
          chatId,
          categoryMessage.message_id
        );
      } catch (e) {}

      try {
        // =====================================================
        // API CONFIG
        // =====================================================
        const apis = await axios.get(
          "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
        );

        const base = apis.data.api;

        let videoUrl = null;
        let caption = "🎬 Here's your video:";

        // =====================================================
        // 🎲 MIXVIDEO
        // =====================================================
        if (categoryEndpoint === "/video/mixvideo") {
          console.log("🎲 Requesting mixvideo API...");

          let res;

          // 429 হলে সর্বোচ্চ 3 বার চেষ্টা
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              res = await axios.get(
                `${base}/video/mixvideo`,
                {
                  timeout: 30000,
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                    Accept: "application/json",
                  },
                }
              );

              break;
            } catch (err) {
              if (
                err.response?.status === 429 &&
                attempt < 3
              ) {
                console.log(
                  `⚠️ 429 - retry ${attempt}/3`
                );

                await new Promise((resolve) =>
                  setTimeout(resolve, 4000)
                );

                continue;
              }

              throw err;
            }
          }

          if (!res) {
            throw new Error(
              "Mixvideo API response পাওয়া যায়নি"
            );
          }

          // ===================================================
          // API DATA
          // ===================================================
          const list = res.data?.data;

          if (!Array.isArray(list) || list.length === 0) {
            throw new Error(
              "❌ Mixvideo API থেকে ভিডিও পাওয়া যায়নি"
            );
          }

          console.log(
            `🎲 API থেকে ${list.length} টি video পাওয়া গেছে`
          );

          // ===================================================
          // শুধু valid URL বের করা
          // ===================================================
          const validVideos = list
            .map((item) => {
              if (typeof item === "string") {
                return {
                  url: item,
                  name: "🎬 RANDOM VIDEO",
                };
              }

              if (
                item &&
                typeof item.url === "string"
              ) {
                return {
                  url: item.url,
                  name:
                    item.name ||
                    item.title ||
                    "🎬 RANDOM VIDEO",
                };
              }

              return null;
            })
            .filter(
              (item) =>
                item &&
                item.url &&
                item.url.startsWith("http")
            );

          if (validVideos.length === 0) {
            throw new Error(
              "❌ API response-এ valid video URL নেই"
            );
          }

          // ===================================================
          // 🎲 RANDOM VIDEO SELECT
          // ===================================================
          const randomVideo =
            validVideos[
              Math.floor(
                Math.random() *
                  validVideos.length
              )
            ];

          videoUrl = randomVideo.url;
          caption = randomVideo.name;

          console.log(
            "🎬 Selected API video:",
            videoUrl
          );
        }

        // =====================================================
        // NORMAL CATEGORY
        // =====================================================
        else {
          const res = await axios.get(
            `${base}${categoryEndpoint}`,
            {
              timeout: 30000,
              headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "application/json",
              },
            }
          );

          caption =
            res.data?.shaon ||
            res.data?.cp ||
            res.data?.data?.title ||
            "🎬 Here's your video:";

          if (
            typeof res.data.data === "string"
          ) {
            videoUrl = res.data.data;
          } else if (
            Array.isArray(res.data.data)
          ) {
            if (res.data.data.length === 0) {
              throw new Error(
                "❌ Video পাওয়া যায়নি"
              );
            }

            const random =
              res.data.data[
                Math.floor(
                  Math.random() *
                    res.data.data.length
                )
              ];

            videoUrl =
              random?.url ||
              random;

            if (
              random &&
              typeof random === "object"
            ) {
              caption =
                random.name ||
                random.title ||
                caption;
            }
          } else if (
            res.data.data &&
            typeof res.data.data === "object" &&
            res.data.data.url
          ) {
            videoUrl =
              res.data.data.url;
          } else if (res.data.url) {
            videoUrl = res.data.url;
          } else {
            throw new Error(
              "❌ Invalid API response"
            );
          }
        }

        // =====================================================
        // URL CHECK
        // =====================================================
        if (
          !videoUrl ||
          typeof videoUrl !== "string"
        ) {
          throw new Error(
            "❌ Video URL পাওয়া যায়নি"
          );
        }

        console.log(
          "📥 Downloading:",
          videoUrl
        );

        // =====================================================
        // CACHE DIRECTORY
        // =====================================================
        const cacheDir = path.join(
          __dirname,
          "caches"
        );

        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, {
            recursive: true,
          });
        }

        const filePath = path.join(
          cacheDir,
          `mix_${Date.now()}.mp4`
        );

        // =====================================================
        // 🎥 API URL থেকে VIDEO DOWNLOAD
        // extension না থাকলেও download হবে
        // =====================================================
        const videoResponse =
          await axios.get(
            videoUrl,
            {
              responseType: "stream",
              timeout: 180000,
              maxContentLength:
                200 * 1024 * 1024,
              maxBodyLength:
                200 * 1024 * 1024,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                Referer: videoUrl,
              },
            }
          );

        const contentType =
          videoResponse.headers[
            "content-type"
          ] || "";

        console.log(
          "📦 Content-Type:",
          contentType
        );

        // =====================================================
        // WRITE VIDEO FILE
        // =====================================================
        const writer =
          fs.createWriteStream(
            filePath
          );

        videoResponse.data.pipe(
          writer
        );

        await new Promise(
          (resolve, reject) => {
            writer.on(
              "finish",
              resolve
            );

            writer.on(
              "error",
              reject
            );
          }
        );

        // =====================================================
        // FILE SIZE CHECK
        // =====================================================
        const stat =
          fs.statSync(filePath);

        if (!stat.size) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}

          throw new Error(
            "❌ Video download হয়নি"
          );
        }

        console.log(
          `✅ Video downloaded: ${stat.size} bytes`
        );

        // =====================================================
        // 📤 SEND VIDEO
        // =====================================================
        await api.sendVideo(
          chatId,
          fs.createReadStream(
            filePath
          ),
          {
            caption,

            reply_to_message_id:
              loading.message_id,

            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🧑‍💻 Owner",
                    url: "https://t.me/shaonproject",
                  },
                ],
              ],
            },
          }
        );

        // =====================================================
        // DELETE CACHE
        // =====================================================
        try {
          fs.unlinkSync(
            filePath
          );
        } catch (e) {}

        // =====================================================
        // DELETE LOADING
        // =====================================================
        try {
          await api.deleteMessage(
            chatId,
            loading.message_id
          );
        } catch (e) {}

      } catch (err) {
        console.error(
          "❌ ALBUM ERROR:",
          err.message
        );

        try {
          if (
            loading &&
            loading.message_id
          ) {
            await api.editMessageText(
              chatId,
              loading.message_id,
              `❌ Error: ${err.message}`
            );
          }
        } catch (e) {
          await api.sendMessage(
            chatId,
            `❌ Error: ${err.message}`
          );
        }
      }
    });
  },
};
