const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'kawinn',
    description: 'Menikahkan pet dengan pet milik pemain lain',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length === 0 || args.length < 3) {
            return await sock.sendMessage(chatId, { text: '⚠️ *Format salah!*\nCara pakai: `!kawin @tag_pemilik_pasangan [ID_Pet_Kamu] [ID_Pet_Pasangan]`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];
        
        if (senderNumber === targetNumber) {
            return await sock.sendMessage(chatId, { text: '⚠️ Pet kamu tidak bisa dikawinkan dengan pet milikmu sendiri (harus beda pemilik)!' }, { quoted: msg });
        }

        const idPetSendiri = parseInt(args[1]);
        const idPetLawan = parseInt(args[2]);

        const petSendiriList = global.db.pet[senderNumber] || [];
        const petLawanList = global.db.pet[targetNumber] || [];

        const petPengaju = petSendiriList.find(p => p.id === idPetSendiri);
        const petTarget = petLawanList.find(p => p.id === idPetLawan);

        if (!petPengaju) return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki pet dengan ID ${idPetSendiri}.` }, { quoted: msg });
        if (!petTarget) return await sock.sendMessage(chatId, { text: `⚠️ Pemain tersebut tidak memiliki pet dengan ID ${idPetLawan}.` }, { quoted: msg });

        // Syarat kawin 1: Spesies harus sama
        if (petPengaju.spesies !== petTarget.spesies) {
            return await sock.sendMessage(chatId, { text: `⚠️ Gagal! Spesies mereka berbeda (${petPengaju.spesies} & ${petTarget.spesies}).` }, { quoted: msg });
        }

        // Syarat kawin 2: Minimal level 10 (bisa kamu ubah angkanya)
        if (petPengaju.level < 10 || petTarget.level < 10) {
            return await sock.sendMessage(chatId, { text: `⚠️ Gagal! Kedua pet harus minimal Level 10 agar cukup umur untuk kawin.` }, { quoted: msg });
        }

        // Inisialisasi object proposal jika belum ada di memori
        if (!global.db.proposalKawin) global.db.proposalKawin = {};

        const teksProposal = `💍 *PROPOSAL KAWIN PET!* 💍\n\n@${senderNumber} ingin menikahkan *${petPengaju.nama}* dengan *${petTarget.nama}* milik @${targetNumber}!\n\n👉 *@${targetNumber}, balas (reply) pesan ini dengan mengetik "gas" untuk menerima ajakan kawin!*`;

        // 1. Kirim pesan proposal & simpan ke variabel botMsg
        const botMsg = await sock.sendMessage(chatId, { 
            text: teksProposal, 
            mentions: [senderId, targetId] 
        }, { quoted: msg });

        // 2. Simpan sesi proposal menggunakan ID PESAN BOT
        global.db.proposalKawin[botMsg.key.id] = {
            pengaju: senderNumber,
            idPetPengaju: petPengaju.id,
            target: targetNumber,
            idPetTarget: petTarget.id,
            chatId: chatId,
            waktu: Date.now()
        };
    }
};