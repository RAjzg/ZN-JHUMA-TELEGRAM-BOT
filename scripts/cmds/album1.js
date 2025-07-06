const axios = require("axios");

module.exports = {
	config: {
		name: "album1",
		version: "2.0.1",
		role: 0,
		author: "Shaon Ahmed",
		description: "Album system with Imgur and category support",
		category: "media",
		countDown: 5,
	},

	onStart: async ({
		event,
		api,
		bot,
		args
	}) => {
		const chatId = event.chat.id;
		const input = args.join(" ").trim().toLowerCase();

		const apis = await axios.get("https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json");
		const Shaon = apis.data.api;
		const Imgur = apis.data.imgur;

		// Help Message
		if (input === "help") {
			return api.sendMessage(chatId, `

╭─『 📁 Album Bot Help 』─╮

📝 Available Commands: /album                  ➤ List all categories /album <category>       ➤ Get random video from category /album add <category>   ➤ Add photo/video by replying /album create <name>    ➤ Create new category /album delete <name>    ➤ Delete category

📌 Example: /album love /album add sad /album create anime /album delete funny

⚠️ Note: 18+ content is strictly prohibited!

© Developed by Shaon Project ╰────────────────────────╯ `);
		}

		// List all categories
		if (input === "" || input === "list") {
			const res = await axios.get(`${Shaon}/album?list=true`);
			return api.sendMessage(chatId, `📁 Categories:

${res.data.data}`);
		}

		// Create category
		if (input.startsWith("create ")) {
			const name = input.slice(7).trim();
			const res = await axios.get(`${Shaon}/album?create=${encodeURIComponent(name)}`);
			return api.sendMessage(chatId, `✅ ${res.data.message}`);
		}

		// Delete category
		if (input.startsWith("delete ")) {
			const name = input.slice(7).trim();
			const res = await axios.get(`${Shaon}/album?delete=${encodeURIComponent(name)}`);
			return api.sendMessage(chatId, `🗑️ ${res.data.message}`);
		}

		// Add media
		if (input.startsWith("add ")) {
			const category = input.slice(4).trim();
			api.sendMessage(chatId, `📤 Please reply to a media file (video/photo) with caption '${category}'`);

			bot.once("message", async (msg) => {
				const file = msg.video || msg.photo?.[msg.photo.length - 1];
				const caption = msg.caption || category;

				if (!file || !caption)
					return api.sendMessage(chatId, "❗ Please reply with a media file and category in caption.");

				try {
					const fileLink = await api.getFileLink(file.file_id);
					const uploaded = await axios.get(`${Imgur}/imgur?link=${encodeURIComponent(fileLink)}`);
					const imgurLink = uploaded.data.link || uploaded.data.uploaded?.image;

					await axios.get(`${Shaon}/album?add=${encodeURIComponent(caption)}&url=${encodeURIComponent(imgurLink)}`);
					return api.sendMessage(chatId, `✅ Media added to '${caption}' category.`);

				} catch (e) {
					return api.sendMessage(chatId, `❌ Failed to add media: ${e.message}`);
				}
			});
			return;
		}

		// Get random video from category
		if (input) {
			try {
				const res = await axios.get(`${Shaon}/album?type=${encodeURIComponent(input)}`);
				const {
					url,
					cp,
					category,
					count,
					note
				} = res.data;

				await api.sendVideo(chatId, url, {
					caption: `${cp || ''}\n🎞️ Category: ${category}\n📦 Total: ${count || 1}${note ? `\nℹ️ ${note}` : ""}`,
					reply_markup: {
						inline_keyboard: [
							[{
								text: "Owner",
								url: "https://t.me/shaonproject"
							}]
						]
					}
				});
			} catch (err) {
				return api.sendMessage(chatId, `❌ Failed to fetch video: ${err.message}`);
			}
		}

	}
};
