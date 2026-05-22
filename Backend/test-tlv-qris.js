function parseQRIS(qrisStr) {
    const tags = {};
    let index = 0;
    while (index < qrisStr.length) {
        if (index + 4 > qrisStr.length) break;
        const tag = qrisStr.substring(index, index + 2);
        const length = parseInt(qrisStr.substring(index + 2, index + 4), 10);
        if (isNaN(length)) break;
        const value = qrisStr.substring(index + 4, index + 4 + length);
        tags[tag] = value;
        console.log(`Parsed Tag: ${tag}, Length: ${length}, Value: ${value}`);
        index += 4 + length;
    }
    return tags;
}

const dummyStaticQRIS = "00020101021126660014ID.CO.QRIS.WWW01189360091531536780960214818451100140220303UMI51440014ID.CO.QRIS.WWW0215ID10200220303660303UMI5204581253033605802ID5914DUMMY MERCHANT6006JAKARTA610512345621605120121102717016304E856";
parseQRIS(dummyStaticQRIS);
