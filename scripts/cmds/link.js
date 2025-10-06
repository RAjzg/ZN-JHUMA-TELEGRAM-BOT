// link.js
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "link",
  version: "1.0.2",
  role: 0,
  credits: "Shaon Ahmed",
  description: "Detect telegram/group links in messages, warn and kick repeat offenders",
  category: "media",
  usages: "/tikinfo <username>",
  cooldowns: 5,
};

// path to warnings file (create data folder next to this file)
const DATA_DIR = path.join(__dirname, 'caches');
const WARN_FILE = path.join(DATA_DIR, 'warnings.json');
const WARN_LIMIT = 2; // WARN_LIMIT এ পৌঁছলে কিক/রিমুভ হবে
const RESET_AFTER_MS = 24 * 60 * 60 * 1000; // 24 ঘন্টা পর রিসেট (আপনি চাইলে পরিবর্তন করবেন)

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(WARN_FILE)) fs.writeFileSync(WARN_FILE, JSON.stringify({}), 'utf8');

function loadWarnings() {
  try {
    return JSON.parse(fs.readFileSync(WARN_FILE, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}
function saveWarnings(obj) {
  try {
    fs.writeFileSync(WARN_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save warnings:', e);
  }
}

function isTelegramInvite(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    't.me/joinchat',
    't.me/+',
    't.me/',
    'telegram.me/',
    'joinchat',
    'invite.t.me/',
    'https://t.me/',
    'http://t.me/',
  ];
  return patterns.some(p => t.includes(p));
}

// Clean-up scheduled timers in memory so warnings reset after RESET_AFTER_MS
const timers = {}; // key: `${threadID}_${userID}` => timeout

module.exports.run = async ({ api, event, args, Users, Threads, global }) => {
  // This command is intended to run on any text message.
  // Many bot frameworks call command only when invoked; if your framework only triggers commands
  // on prefixes, then you should adapt this file to be used as an onMessage handler instead.
  try {
    const { threadID, senderID, messageID } = event;
    const text = (event.body || '').toString();

    // Only act in groups/supergroups - depending on framework you may check threadType or threadInfo
    // If not available, this will still run; you can skip if private message by checking threadID === senderID etc.
    if (!isTelegramInvite(text)) return;

    // load current warnings
    const warnings = loadWarnings();
    if (!warnings[threadID]) warnings[threadID] = {};
    if (!warnings[threadID][senderID]) warnings[threadID][senderID] = { count: 0, lastTs: 0 };

    warnings[threadID][senderID].count += 1;
    warnings[threadID][senderID].lastTs = Date.now();
    saveWarnings(warnings);

    // schedule reset
    const timerKey = `${threadID}_${senderID}`;
    if (timers[timerKey]) clearTimeout(timers[timerKey]);
    timers[timerKey] = setTimeout(() => {
      try {
        const w = loadWarnings();
        if (w[threadID] && w[threadID][senderID]) {
          delete w[threadID][senderID];
          if (Object.keys(w[threadID]).length === 0) delete w[threadID];
          saveWarnings(w);
        }
      } catch (e) { /* ignore */ }
    }, RESET_AFTER_MS);

    // First warning: send the fixed message (with mention if possible)
    if (warnings[threadID][senderID].count < WARN_LIMIT) {
      // try to mention by username if available via Users (framework dependent)
      let mention = '';
      try {
        if (Users && typeof Users.getName === 'function') {
          const name = await Users.getName(senderID);
          mention = name ? `${name}` : '';
        }
      } catch (e) {
        mention = '';
      }

      const warnText = `⚠️ ${mention || '@shaonproject'}, গ্রুপ লিংক দেওয়া নিষেধ! আবার দিলে কিক করা হবে।`;
      // send reply (api.sendMessage or api.sendMessageWithMention depends on framework)
      try {
        await api.sendMessage(warnText, threadID, messageID);
      } catch (e) {
        // fallback: minimal send
        try { await api.sendMessage(warnText, threadID); } catch (err) { console.error(err); }
      }
      return;
    }

    // WARN_LIMIT বা তার বেশি হলে কিক/রিমুভ করার চেষ্টা
    try {
      // Optional: delete the offending message first
      try { await api.deleteMessage(messageID); } catch (e) { /* ignore */ }

      // Remove user from group. Method name varies by framework:
      // - For node-telegram-bot-api / telegraf: use banChatMember / kickChatMember
      // - For facebook-chat-api like frameworks: use removeUserFromGroup(userID, threadID)
      // We'll attempt common method names with fallbacks.

      // 1) telegram-style (telegraf / bot API) - banChatMember
      if (typeof api.banChatMember === 'function') {
        await api.banChatMember(senderID);
      } else if (typeof api.kickChatMember === 'function') {
        await api.kickChatMember(senderID);
      } else if (typeof api.removeUserFromGroup === 'function') {
        // facebook-chat-api style
        await api.removeUserFromGroup(senderID, threadID);
      } else if (typeof api.removeUser === 'function') {
        await api.removeUser(senderID, threadID);
      } else {
        // Unknown API - send a message telling admins to manually remove
        await api.sendMessage(`⚠️ @${senderID}, আপনি গ্রুপ লিংক দিয়েছেন। বটের কাছে কিক করার অনুমতি নেই — অনুগ্রহ করে গ্রুপ নিয়ম মেনে চলুন।`, threadID);
        return;
      }

      // notify group
      await api.sendMessage(`${senderID} কে গ্রুপ থেকে কিক করা হলো কারণ গ্রুপ লিংক শেয়ার করা হয়েছে।`, threadID);
      // remove the warning record
      const w2 = loadWarnings();
      if (w2[threadID] && w2[threadID][senderID]) {
        delete w2[threadID][senderID];
        if (Object.keys(w2[threadID]).length === 0) delete w2[threadID];
        saveWarnings(w2);
      }
    } catch (kickErr) {
      console.error('Kick/Remove error:', kickErr);
      // If cannot kick, send stronger warning
      try {
        await api.sendMessage(`⚠️ @${senderID}, আপনি আবার লিংক দিয়েছেন। বটের কাছে কিক করার অনুমতি নেই — অনুগ্রহ করে গ্রুপ নিয়ম মেনে চলুন।`, threadID);
      } catch (e) { /* ignore */ }
    }
  } catch (err) {
    console.error('link command error:', err);
  }
};
