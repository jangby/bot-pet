const fs = require('fs');
const path = require('path');

const katalogGear = {
    "cakar_besi": { nama: "Cakar Besi", tipe: "senjata", stat: 50 },
    "taring_naga": { nama: "Taring Naga", tipe: "senjata", stat: 200 },
    "kalung_darah": { nama: "Kalung Darah", tipe: "armor", stat: 200 },
    "zirah_titanium": { nama: "Zirah Titanium", tipe: "armor", stat: 800 }
};

module.exports = {
    name: 'pakai',
    description: 'Memasang perlengkapan ke pet',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 2) return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!pakai 1 cakar_besi` (Memasang Cakar Besi ke Pet ID 1)' }, { quoted: msg });

        const petId = parseInt(args[0]);
        const idItem = args[1].toLowerCase();

        if (!katalogGear[idItem]) return await sock.sendMessage(chatId, { text: '⚠️ Gear tersebut tidak terdaftar di sistem.' }, { quoted: msg });
        if (!global.db.inventory[senderNumber] || !global.db.inventory[senderNumber][idItem] || global.db.inventory[senderNumber][idItem] <= 0) {
            return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki *${katalogGear[idItem].nama}* di inventory!` }, { quoted: msg });
        }

        const petList = global.db.pet[senderNumber] || [];
        const petIndex = petList.findIndex(p => p.id === petId);

        if (petIndex === -1) return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki pet dengan ID ${petId}.` }, { quoted: msg });

        const petTarget = petList[petIndex];
        const tipeGear = katalogGear[idItem].tipe; // "senjata" atau "armor"

        // Inisialisasi slot gear di pet jika belum ada
        if (!petTarget.gear) petTarget.gear = { senjata: null, armor: null };

        // Copot gear lama jika ada, dan kembalikan ke inventory
        if (petTarget.gear[tipeGear]) {
            const gearLama = petTarget.gear[tipeGear];
            global.db.inventory[senderNumber][gearLama] = (global.db.inventory[senderNumber][gearLama] || 0) + 1;
        }

        // Pasang gear baru dan kurangi dari inventory
        petTarget.gear[tipeGear] = idItem;
        global.db.inventory[senderNumber][idItem] -= 1;

        // Jika itu Armor, langsung tambah HP (sebagai bonus max HP)
        if (tipeGear === 'armor') {
            petTarget.hp += katalogGear[idItem].stat;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        await sock.sendMessage(chatId, { text: `🛡️ *GEAR TERPASANG!*\n\n*${petTarget.nama}* sekarang menggunakan *${katalogGear[idItem].nama}*!\nKekuatan tempurnya telah meningkat tajam.` }, { quoted: msg });
    }
};