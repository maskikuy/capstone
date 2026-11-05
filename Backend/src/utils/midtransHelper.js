import crypto from 'crypto';
import QRCode from 'qrcode';
import baseLogger from './logger.js';

const logger = baseLogger.child({ module: 'MidtransHelper' });

const getServerKey = () => process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-25UVr.PJ3M7T2kWZQM7ze6K0';
const isProduction = () => String(process.env.MIDTRANS_IS_PRODUCTION) === 'true';

const getBaseUrl = () => {
    return isProduction() 
        ? 'https://api.midtrans.com/v2' 
        : 'https://api.sandbox.midtrans.com/v2';
};

const getAuthHeader = () => {
    const serverKey = getServerKey();
    const encoded = Buffer.from(serverKey + ':').toString('base64');
    return `Basic ${encoded}`;
};

/**
 * Buat transaksi QRIS Dinamis via Midtrans Core API
 */
export const createQrisCharge = async ({ orderId, grossAmount, customerName }) => {
    const url = `${getBaseUrl()}/charge`;
    const roundedAmount = Math.round(Number(grossAmount) || 0);

    const payload = {
        payment_type: 'qris',
        transaction_details: {
            order_id: String(orderId),
            gross_amount: roundedAmount
        },
        customer_details: {
            first_name: customerName || 'Pelanggan'
        },
        qris: {
            acquirer: 'gopay'
        }
    };

    logger.info(`Sending QRIS charge request to Midtrans for order: ${orderId}, amount: ${roundedAmount}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader()
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || (data.status_code !== '201' && data.status_code !== '200')) {
        logger.error(`Midtrans charge error (${data.status_code}): ${data.status_message || response.statusText}`);
        throw new Error(data.status_message || 'Gagal membuat QRIS di Midtrans');
    }

    // Ambil QR URL atau render qr_string menjadi base64 Data URL
    let qrImage = '';
    const actionUrl = data.actions?.find(a => a.name === 'generate-qr-code')?.url || '';

    if (data.qr_string) {
        try {
            qrImage = await QRCode.toDataURL(data.qr_string, {
                width: 320,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (qrErr) {
            logger.warn(`Failed generating QR Data URL from qr_string: ${qrErr.message}`);
            qrImage = actionUrl;
        }
    } else {
        qrImage = actionUrl;
    }

    logger.info(`Midtrans QRIS created successfully for order: ${orderId}`);

    return {
        transaction_id: data.transaction_id,
        order_id: data.order_id,
        gross_amount: data.gross_amount,
        qr_string: data.qr_string || '',
        qr_image: qrImage,
        action_url: actionUrl,
        expiry_time: data.expiry_time,
        transaction_status: data.transaction_status
    };
};

/**
 * Cek status transaksi langsung ke Midtrans API
 */
export const checkMidtransStatus = async (midtransOrderId) => {
    const url = `${getBaseUrl()}/${encodeURIComponent(midtransOrderId)}/status`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': getAuthHeader()
        }
    });

    const data = await response.json();
    if (!response.ok) {
        logger.warn(`Midtrans status check warning (${data.status_code}): ${data.status_message || response.statusText}`);
    }
    return data;
};

/**
 * Validasi signature webhook notifikasi dari Midtrans
 */
export const verifyMidtransSignature = (orderId, statusCode, grossAmount, receivedSignature) => {
    const serverKey = getServerKey();
    const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(raw).digest('hex');
    return expectedSignature === receivedSignature;
};

export default {
    createQrisCharge,
    checkMidtransStatus,
    verifyMidtransSignature
};
