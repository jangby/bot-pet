const fs = require('fs');
const path = require('path');

// --- DAFTAR GEAR TERBARU (12 ITEM) ---
const katalogGear = {
    // Senjata (+ Power)
    "cakar_besi": { nama: "Cakar Besi", tipe: "senjata", stat: 50 },
    "gigi_beracun": { nama: "Gigi Beracun", tipe: "senjata", stat: 120 },
    "cakar_baja": { nama: "Cakar Baja Titanium", tipe: "senjata", stat: 250 },
    "taring_naga": { nama: "Taring Naga Api", tipe: "senjata", stat: 450 },
    "pedang_excalibur": { nama: "Pedang Excalibur", tipe: "senjata", stat: 800 },
    "sabit_kematian": { nama: "Sabit Kematian", tipe: "senjata", stat: 1500 },
    
    // Armor (+ Health/HP)
    "kalung_darah": { nama: "Kalung Darah", tipe: "armor", stat: 200 },
    "zirah_besi": { nama: "Zirah Besi", tipe: "armor", stat: 500 },
    "zirah_titanium": { nama: "Zirah Titanium", tipe: "armor", stat: 1000 },
    "sisik_naga": { nama: "Sisik Naga Kebal", tipe: "armor", stat: 2000 },
    "helm_spartan": { nama: "Helm Spartan", tipe: "armor", stat: 3500 },
    "aura_dewa": { nama: "Aura Dewa Pelindung", tipe: "armor", stat: 6000 }
};

module.exports = {
    name: 'pakai',
    description: 'Memasang perlengkapan ke pet',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!pakai 1 cakar_besi`\n_(Memasang Cakar Besi ke Pet ID 1)_' }, { quoted: msg });
        }

        const petId = args[0]; 
        const idItem = args[1].toLowerCase();

        if (!katalogGear[idItem]) {
            return await sock.sendMessage(chatId, { text: `⚠️ Gear dengan kode "${idItem}" tidak terdaftar di sistem Blacksmith.` }, { quoted: msg });
        }
        
        // --- 🛡️ PERBAIKAN BUG INVENTORY UNDEFINED 🛡️ ---
        if (!global.db.inventory) {
            const invPath = path.join(process.cwd(), 'data/inventory.json');
            if (fs.existsSync(invPath)) {
                global.db.inventory = JSON.parse(fs.readFileSync(invPath, 'utf-8'));
            } else {
                global.db.inventory = {};
            }
        }
        if (!global.db.inventory[senderNumber]) {
            global.db.inventory[senderNumber] = {};
        }

        // Mengecek apakah pemain punya barangnya
        if (!global.db.inventory[senderNumber][idItem] || global.db.inventory[senderNumber][idItem] <= 0) {
            return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki *${katalogGear[idItem].nama}* di dalam tas (!inv)!` }, { quoted: msg });
        }

        const petList = global.db.pet[senderNumber] || [];
        const petIndex = petList.findIndex(p => p.id == petId); 

        if (petIndex === -1) {
            return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki peliharaan dengan ID [${petId}].` }, { quoted: msg });
        }

        const petTarget = petList[petIndex];
        const tipeGear = katalogGear[idItem].tipe; 

        if (!petTarget.gear) petTarget.gear = { senjata: null, armor: null };

        // Sistem Copot & Pasang Gear
        if (petTarget.gear[tipeGear]) {
            const gearLama = petTarget.gear[tipeGear];
            
            // Kembalikan ke tas
            global.db.inventory[senderNumber][gearLama] = (global.db.inventory[senderNumber][gearLama] || 0) + 1;
            
            // Cabut efek lama
            if (katalogGear[gearLama]) {
                if (tipeGear === 'armor') {
                    petTarget.health = Math.max(100, (petTarget.health || 100) - katalogGear[gearLama].stat);
                } else if (tipeGear === 'senjata') {
                    petTarget.power = Math.max(0, (petTarget.power || 0) - katalogGear[gearLama].stat);
                }
            }
        }

        // Pasang gear baru
        petTarget.gear[tipeGear] = idItem;
        global.db.inventory[senderNumber][idItem] -= 1;

        if (tipeGear === 'armor') {
            petTarget.health = (petTarget.health || 100) + katalogGear[idItem].stat;
        } else if (tipeGear === 'senjata') {
            petTarget.power = (petTarget.power || 0) + katalogGear[idItem].stat;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        let teksBerhasil = `🛡️ *GEAR BERHASIL TERPASANG!* 🛡️\n\n`;
        teksBerhasil += `*${petTarget.nama}* sekarang mengenakan *${katalogGear[idItem].nama}*!\n\n`;
        teksBerhasil += `✨ *Status Terbaru:*\n`;
        teksBerhasil += `⚔️ Power: *${petTarget.power}*\n`;
        teksBerhasil += `❤️ Max Health: *${petTarget.health}*`;

        await sock.sendMessage(chatId, { text: teksBerhasil }, { quoted: msg });
    }
};