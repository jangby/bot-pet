const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'couple',
    description: 'Menyatakan cinta dan berpasangan dengan pemain lain',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ *Format salah!*\nCara pakai: `!couple @tag_pemain`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];
        
        if (senderNumber === targetNumber) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa berpasangan dengan dirimu sendiri! Cari orang lain dong.' }, { quoted: msg });
        }

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.player[targetNumber]) global.db.player[targetNumber] = { saldo: 0, reputasi: 0 };

        const player1 = global.db.player[senderNumber];
        const player2 = global.db.player[targetNumber];

        if (player1.pasangan) {
            return await sock.sendMessage(chatId, { text: `⚠️ Kamu sudah memiliki pasangan (@${player1.pasangan})! Jangan selingkuh, putus dulu pakai \`!putus\`.` }, { quoted: msg });
        }

        if (player2.pasangan) {
            return await sock.sendMessage(chatId, { text: `⚠️ Sayang sekali, @${targetNumber} sudah memiliki pasangan. Mundur alon-alon...` }, { quoted: msg });
        }

        if (!global.db.proposalCouple) global.db.proposalCouple = {};

        const teksProposal = `💘 *PROPOSAL COUPLE!* 💘\n\n@${senderNumber} menyatakan cinta dan ingin berpasangan dengan @${targetNumber}!\n\n👉 *@${targetNumber}, balas (reply) pesan ini dengan mengetik "gas" jika kamu menerima cintanya!*`;

        const botMsg = await sock.sendMessage(chatId, { 
            text: teksProposal, 
            mentions: [senderId, targetId] 
        }, { quoted: msg });

        global.db.proposalCouple[botMsg.key.id] = {
            pengaju: senderNumber,
            target: targetNumber,
            chatId: chatId,
            waktu: Date.now()
        };
    }
};
