const fs = require('fs');
const path = require('path');

// Daftar perlengkapan yang tersedia (Database Baru 12 Item)
const katalogGear = {
    // Senjata
    "cakar_besi": { nama: "Cakar Besi", tipe: "senjata", stat: 50, harga: 1500, desc: "+50 Damage Serangan" },
    "gigi_beracun": { nama: "Gigi Beracun", tipe: "senjata", stat: 120, harga: 3000, desc: "+120 Damage Serangan" },
    "cakar_baja": { nama: "Cakar Baja Titanium", tipe: "senjata", stat: 250, harga: 5000, desc: "+250 Damage Serangan" },
    "taring_naga": { nama: "Taring Naga Api", tipe: "senjata", stat: 450, harga: 9000, desc: "+450 Damage Serangan" },
    "pedang_excalibur": { nama: "Pedang Excalibur", tipe: "senjata", stat: 800, harga: 16000, desc: "+800 Damage Serangan" },
    "sabit_kematian": { nama: "Sabit Kematian", tipe: "senjata", stat: 1500, harga: 25000, desc: "+1500 Damage Serangan" },
    
    // Armor
    "kalung_darah": { nama: "Kalung Darah", tipe: "armor", stat: 200, harga: 1500, desc: "+200 Max HP" },
    "zirah_besi": { nama: "Zirah Besi", tipe: "armor", stat: 500, harga: 3500, desc: "+500 Max HP" },
    "zirah_titanium": { nama: "Zirah Titanium", tipe: "armor", stat: 1000, harga: 7000, desc: "+1000 Max HP" },
    "sisik_naga": { nama: "Sisik Naga Kebal", tipe: "armor", stat: 2000, harga: 12000, desc: "+2000 Max HP" },
    "helm_spartan": { nama: "Helm Spartan", tipe: "armor", stat: 3500, harga: 18000, desc: "+3500 Max HP" },
    "aura_dewa": { nama: "Aura Dewa Pelindung", tipe: "armor", stat: 6000, harga: 30000, desc: "+6000 Max HP" }
};

module.exports = {
    name: 'tokogear',
    description: 'Membeli perlengkapan (senjata/armor) untuk pet via Web',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Tampilkan Link Web jika tidak ada argumen "beli"
        if (args.length === 0 || args[0] !== 'beli') {
            const linkWebBlacksmith = "https://d687-180-241-241-59.ngrok-free.app/tokogear.html";
            
            let teksToko = `⚒️ *BLACKSMITH / TOKO GEAR* ⚒️\n\n`;
            teksToko += `Toko perlengkapan kini pindah ke antarmuka Web agar lebih mudah memilih senjata dan zirah.\n\n`;
            teksToko += `👉 *KLIK LINK DI BAWAH UNTUK MASUK BENGKEL:*\n`;
            teksToko += `🌐 ${linkWebBlacksmith}\n\n`;
            teksToko += `_Pilih Gear di web, klik beli, dan kamu akan diarahkan kembali ke sini untuk pembayaran._`;
            
            return await sock.sendMessage(chatId, { text: teksToko }, { quoted: msg });
        }

        // 2. Logika Pembelian (Terpicu dari Web)
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

        await sock.sendMessage(chatId, { text: `🎉 *PEMBELIAN GEAR SUKSES!*\n\nKamu membeli *${itemTerpilih.nama}* seharga *${itemTerpilih.harga.toLocaleString('id-ID')} 💠*.\n\n_Ketik \`!pakai [ID_Pet] ${idItem}\` untuk memasangkan perlengkapan ini ke peliharaanmu._` }, { quoted: msg });
    }
};