const fs = require('fs');
const path = require('path');

// Daftar perlengkapan yang tersedia
const katalogGear = {
    "cakar_besi": { nama: "Cakar Besi", tipe: "senjata", stat: 50, harga: 1500, desc: "+50 Damage Serangan" },
    "taring_naga": { nama: "Taring Naga", tipe: "senjata", stat: 200, harga: 5000, desc: "+200 Damage Serangan" },
    "kalung_darah": { nama: "Kalung Darah", tipe: "armor", stat: 200, harga: 7000, desc: "+200 Max HP" },
    "zirah_titanium": { nama: "Zirah Titanium", tipe: "armor", stat: 800, harga: 10000, desc: "+800 Max HP" }
};

module.exports = {
    name: 'tokogear',
    description: 'Membeli perlengkapan (senjata/armor) untuk pet',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Tampilkan daftar gear jika tidak ada argumen beli
        if (args.length === 0 || args[0] !== 'beli') {
            let teksToko = `⚒️ *BLACKSMITH / TOKO GEAR* ⚒️\n\nPerkuat peliharaanmu untuk Boss Raid & Duel!\n\n`;
            for (const [id, item] of Object.entries(katalogGear)) {
                teksToko += `⚔️ *${item.nama}* (${item.tipe.toUpperCase()})\n`;
                teksToko += `   Efek: ${item.desc}\n`;
                teksToko += `   Harga: *${item.harga.toLocaleString('id-ID')} 💠*\n`;
                teksToko += `   Format Beli: \`!tokogear beli ${id}\`\n\n`;
            }
            return await sock.sendMessage(chatId, { text: teksToko }, { quoted: msg });
        }

        // Logika Pembelian
        const idItem = args[1]?.toLowerCase();
        const itemTerpilih = katalogGear[idItem];

        if (!itemTerpilih) return await sock.sendMessage(chatId, { text: `⚠️ Gear dengan ID "${idItem}" tidak ditemukan.` }, { quoted: msg });

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0 };
        if (!global.db.inventory) global.db.inventory = {};
        if (!global.db.inventory[senderNumber]) global.db.inventory[senderNumber] = {};

        const saldoPemain = parseInt(global.db.player[senderNumber].saldo) || 0;
        if (saldoPemain < itemTerpilih.harga) {
            return await sock.sendMessage(chatId, { text: `⚠️ Uangmu tidak cukup! Harga ${itemTerpilih.nama} adalah *${itemTerpilih.harga.toLocaleString('id-ID')} 💠*.` }, { quoted: msg });
        }

        // Eksekusi pembelian
        global.db.player[senderNumber].saldo -= itemTerpilih.harga;
        global.db.bank.brankas = (global.db.bank.brankas || 1000000) + itemTerpilih.harga; // Uang lari ke bank
        
        global.db.inventory[senderNumber][idItem] = (global.db.inventory[senderNumber][idItem] || 0) + 1;

        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        await sock.sendMessage(chatId, { text: `🎉 Pembelian Sukses!\n\nKamu membeli *${itemTerpilih.nama}* seharga *${itemTerpilih.harga.toLocaleString('id-ID')} 💠*.\n\n_Ketik \`!pakai [ID_Pet] ${idItem}\` untuk memasangkannya ke peliharaan._` }, { quoted: msg });
    }
};