/**
 * COMMAND: !intro
 * Mengirim template perkenalan untuk anggota baru yang baru bergabung ke grup.
 * 
 * Tidak memerlukan library tambahan.
 * Bisa juga dipanggil otomatis dari event group-participants.update di index.js.
 * 
 * Contoh penggunaan manual: !intro
 */

module.exports = {
    name: 'intro',
    description: 'Kirim template perkenalan untuk anggota baru',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderJid.replace(/:\d+/, '').split('@')[0];

        const templatePerkenalan = 
`🌟 *SELAMAT DATANG DI GRUP!* 🌟
─────────────────────────

Halo @${senderNumber}! 👋

Senang kamu bergabung bersama kami.
Silakan perkenalkan dirimu dengan mengisi template berikut:

📝 *TEMPLATE PERKENALAN*

• 👤 *Nama:*
• 🎂 *Usia:*
• 📍 *Domisili:*
• 💼 *Pekerjaan/Sekolah:*
• 🎯 *Hobi:*
• 🔍 *Tahu grup ini dari mana?*

─────────────────────────
_Selamat bergabung dan semoga betah! 😊_`;

        await sock.sendMessage(chatId, {
            text: templatePerkenalan,
            mentions: [senderJid]
        }, { quoted: msg });
    }
};
