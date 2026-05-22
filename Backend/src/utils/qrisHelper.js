import QRCode from 'qrcode';

// Fungsi untuk menghitung CRC16 (Wajib ada di akhir QRIS)
function convertCRC16(str) {
    let crc = 0xFFFF;
    const strlen = str.length;

    for (let c = 0; c < strlen; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    if (hex.length === 3) hex = "0" + hex;
    if (hex.length === 2) hex = "00" + hex;
    if (hex.length === 1) hex = "000" + hex;
    
    return hex;
}

// Fungsi pembantu untuk mem-parse format TLV QRIS
function parseQRIS(qrisStr) {
    const tags = {};
    let index = 0;
    while (index < qrisStr.length) {
        if (index + 4 > qrisStr.length) break;
        const tag = qrisStr.substring(index, index + 2);
        const length = parseInt(qrisStr.substring(index + 2, index + 4), 10);
        if (isNaN(length) || length < 0 || index + 4 + length > qrisStr.length) {
            throw new Error("Malformed TLV structure");
        }
        const value = qrisStr.substring(index + 4, index + 4 + length);
        tags[tag] = value;
        index += 4 + length;
    }
    return tags;
}

export const generateDynamicQRIS = async (rawString, amount) => {
    try {
        // Bersihkan string dari spasi, baris baru, atau tanda kutip pembungkus
        let qris = rawString.trim().replace(/\s+/g, '').replace(/['"]/g, '');

        if (!qris) {
            throw new Error("QRIS statis tidak ditemukan atau kosong");
        }

        const cleanAmount = Math.round(parseFloat(amount));
        const strAmount = cleanAmount.toString();
        const lengthAmount = strAmount.length.toString().padStart(2, '0');
        const tag54 = `54${lengthAmount}${strAmount}`;

        let finalQRIS = "";

        try {
            // 1. Coba parse menggunakan struktur TLV yang aman
            const tags = parseQRIS(qris);
            
            // 2. Ubah tipe QRIS dari statis '11' ke dinamis '12' pada Tag 01
            tags["01"] = "12";
            
            // 3. Sisipkan/update nominal pada Tag 54
            tags["54"] = strAmount;
            
            // 4. Hapus CRC lama (Tag 63) untuk dihitung ulang
            delete tags["63"];
            
            // 5. Susun kembali string QRIS dengan tag terurut secara alfabetis/numerik
            let rebuiltStr = "";
            const sortedTags = Object.keys(tags).sort();
            for (const tag of sortedTags) {
                const val = tags[tag];
                const lenStr = val.length.toString().padStart(2, '0');
                rebuiltStr += `${tag}${lenStr}${val}`;
            }
            
            // 6. Tambahkan header CRC (6304)
            rebuiltStr += "6304";
            
            // 7. Hitung checksum CRC16 baru
            const crc = convertCRC16(rebuiltStr);
            finalQRIS = rebuiltStr + crc;
            
        } catch (tlvError) {
            // Jika parsing TLV gagal (misal karena string dummy bawaan memiliki panjang tag yang tidak akurat),
            // kita gunakan metode manipulasi string fallback yang lebih fleksibel.
            
            // 1. Ganti tipe QRIS dari statis ke dinamis
            let fallbackQris = qris.replace("010211", "010212");

            // 2. Buang 8 karakter CRC lama di akhir string
            fallbackQris = fallbackQris.slice(0, -8);
            
            // 3. Temukan posisi Tag 58 secara case-insensitive
            const splitIndex = fallbackQris.toUpperCase().indexOf("5802ID");
            if (splitIndex === -1) {
                throw new Error("Format QRIS tidak valid (Tag 58 tidak ditemukan)");
            }
            
            const part1 = fallbackQris.slice(0, splitIndex);
            const part2 = fallbackQris.slice(splitIndex);

            // 4. Gabungkan part1 + nominal + part2
            let newString = part1 + tag54 + part2;
            
            // 5. Tambahkan header CRC
            newString += "6304";
            
            // 6. Hitung CRC16 baru
            const crc = convertCRC16(newString);
            finalQRIS = newString + crc;
        }

        // Generate gambar QR Code dalam format Base64 Data URL
        const qrImage = await QRCode.toDataURL(finalQRIS);
        
        return {
            qr_string: finalQRIS,
            qr_image: qrImage
        };

    } catch (error) {
        console.error("Gagal melakukan generate QRIS:", error);
        throw error;
    }
};