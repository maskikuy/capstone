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

export const generateDynamicQRIS = async (rawString, amount) => {
    try {
        // 1. Ganti Tag 01 dari '11' (Statis) ke '12' (Dinamis)
        // Cari di awal string. Biasanya di index 4-6.
        let qris = rawString.replace("010211", "010212");

        // 2. Buang CRC Lama (8 Karakter Terakhir: '6304' + 4 digit CRC)
        // Kita harus membuang buntutnya agar bersih sebelum disusun ulang
        qris = qris.slice(0, -8);
        
        // 3. Siapkan Tag 54 (Nominal)
        const strAmount = amount.toString();
        const lengthAmount = strAmount.length.toString().padStart(2, '0');
        const tag54 = `54${lengthAmount}${strAmount}`;

        // 4. Sisipkan Tag 54 SEBELUM Tag 58 (Country Code)
        // Ini adalah posisi standar QRIS.
        const splitIndex = qris.indexOf("5802ID");
        if(splitIndex === -1) throw new Error("Format QRIS tidak valid (Tag 58 tidak ditemukan)");
        
        const part1 = qris.slice(0, splitIndex);
        const part2 = qris.slice(splitIndex);

        // Gabungkan: Bagian Awal + Nominal + Bagian Akhir
        let newString = part1 + tag54 + part2;
        
        // 5. Tambahkan Header CRC Baru
        newString += "6304";
        
        // 6. Hitung Checksum CRC16 Baru
        const crc = convertCRC16(newString);
        
        // 7. Gabungkan Semuanya
        const finalQRIS = newString + crc;

        // Generate Gambar
        const qrImage = await QRCode.toDataURL(finalQRIS);
        
        return {
            qr_string: finalQRIS,
            qr_image: qrImage
        };

    } catch (error) {
        console.error("Gagal generate QRIS", error);
        throw error;
    }
};