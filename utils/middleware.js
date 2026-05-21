module.exports = {
    isPrivate: (msg) => {
        return !msg.key.remoteJid.endsWith('@g.us');
    },
    isPresiden: (senderNumber) => {
        // Fallback untuk akun LID (Linked ID) WhatsApp terbaru
        if (senderNumber === '168032676651233') return true;
        
        if (!global.db.kabinet) return false;
        
        const sender = String(senderNumber).replace(/[^0-9]/g, '');
        
        // Cek wewenang Presiden
        if (global.db.kabinet.presiden) {
            const presiden = String(global.db.kabinet.presiden).replace(/[^0-9]/g, '');
            if (sender.endsWith(presiden.slice(-10))) return true;
        }
        
        // Cek wewenang Wakil Presiden
        if (global.db.kabinet.wakil_presiden) {
            const wakil = String(global.db.kabinet.wakil_presiden).replace(/[^0-9]/g, '');
            if (sender.endsWith(wakil.slice(-10))) return true;
        }
        
        return false;
    },
    isMenteri: (senderNumber, kementerian) => {
        if (!global.db.kabinet) return false;
        const key = `menteri_${kementerian}`; 
        if (!global.db.kabinet[key] || !global.db.kabinet[key].nomor) return false;
        
        const menteri = String(global.db.kabinet[key].nomor).replace(/[^0-9]/g, '');
        const sender = String(senderNumber).replace(/[^0-9]/g, '');
        return sender.endsWith(menteri.slice(-10));
    },
    getJabatanPlayer: (senderNumber) => {
        if (global.db.player && global.db.player[senderNumber]) {
            return global.db.player[senderNumber].jabatan || 'Warga';
        }
        return 'Warga';
    }
};
