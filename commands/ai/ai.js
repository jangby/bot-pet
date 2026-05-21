/**
 * COMMAND: !ai [pertanyaan]
 * Tanya jawab dengan AI (Google Gemini atau OpenAI ChatGPT).
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * Pilih salah satu API:
 *   A. Google Gemini (GRATIS): https://aistudio.google.com/
 *      → Set: process.env.GEMINI_API_KEY
 * 
 *   B. OpenAI ChatGPT: https://platform.openai.com/
 *      → Set: process.env.OPENAI_API_KEY
 * 
 * Contoh: !ai apa itu black hole?
 */

const axios = require('axios'); // npm install axios

// Pilih provider AI yang ingin digunakan
const PROVIDER_AI = 'gemini'; // 'gemini' atau 'openai'

// ==========================================
// FUNGSI QUERY KE GOOGLE GEMINI
// ==========================================
async function tanyaGemini(pertanyaan) {
    const API_KEY = process.env.GEMINI_API_KEY || 'MASUKKAN_GEMINI_API_KEY';
    const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const responAPI = await axios.post(ENDPOINT, {
        contents: [{ parts: [{ text: pertanyaan }] }]
    }, { timeout: 30000 });

    return responAPI.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada jawaban.';
}

// ==========================================
// FUNGSI QUERY KE OPENAI CHATGPT
// ==========================================
async function tanyaOpenAI(pertanyaan) {
    const API_KEY = process.env.OPENAI_API_KEY || 'MASUKKAN_OPENAI_API_KEY';

    const responAPI = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'Kamu adalah asisten AI yang membantu. Jawab dalam bahasa Indonesia yang mudah dipahami.' },
            { role: 'user', content: pertanyaan }
        ],
        max_tokens: 1000,
        temperature: 0.7
    }, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeout: 30000
    });

    return responAPI.data?.choices?.[0]?.message?.content || 'Tidak ada jawaban.';
}

module.exports = {
    name: 'ai',
    description: 'Tanya jawab dengan AI Gemini/ChatGPT. Format: !ai [pertanyaan]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const pertanyaan = args.join(' ').trim();
        if (!pertanyaan) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!ai [pertanyaanmu]`\n\nContoh: `!ai Apa itu lubang hitam?`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '🤖 Sedang berpikir...' }, { quoted: msg });

            let jawaban;
            if (PROVIDER_AI === 'gemini') {
                jawaban = await tanyaGemini(pertanyaan);
            } else {
                jawaban = await tanyaOpenAI(pertanyaan);
            }

            // Batasi panjang jawaban agar tidak terlalu panjang di WA
            if (jawaban.length > 3000) {
                jawaban = jawaban.substring(0, 3000) + '...\n\n_(Jawaban dipotong karena terlalu panjang)_';
            }

            await sock.sendMessage(chatId, {
                text: `🤖 *AI MENJAWAB:*\n\n${jawaban}`
            }, { quoted: msg });

        } catch (error) {
            console.error('[ERROR] !ai:', error);
            await sock.sendMessage(chatId, {
                text: '❌ AI sedang tidak bisa dijangkau. Cek API Key atau coba lagi nanti.'
            }, { quoted: msg });
        }
    }
};
