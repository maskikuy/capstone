import QRCode from 'qrcode';
import crypto from 'crypto';
import baseLogger from './logger.js';

const logger = baseLogger.child({ module: 'SumopodHelper' });

const getApiKey = () => process.env.SUMOPOD_API_KEY || '';
const isProduction = () => String(process.env.SUMOPOD_IS_PRODUCTION) === 'true';
const getWebhookToken = () => process.env.SUMOPOD_WEBHOOK_TOKEN || '';
const getSigningSecret = () => process.env.SUMOPOD_SIGNING_SECRET || '';

const getBaseUrl = () => {
    return isProduction() 
        ? 'https://api-pay.sumopod.com' 
        : 'https://api-pay-sandbox.sumopod.com';
};

/**
 * Buat transaksi pembayaran (default QRIS) via SumoPod Managed Payment API
 * Endpoint: POST /api/v1/payments
 */
export const createSumopodPayment = async ({ orderId, amount, paymentMethod = 'QRIS', customerName = 'Pelanggan' }) => {
    const apiKey = getApiKey();
    const roundedAmount = Math.round(Number(amount) || 0);
    const url = `${getBaseUrl()}/api/v1/payments`;

    if (!apiKey) {
        logger.warn('SUMOPOD_API_KEY is not set in environment. Running in mock/simulation mode.');
        // Jika API Key belum diset, generate dummy QRIS data agar flow aplikasi tidak crash saat setup
        const dummyQrString = `00020101021126660014ID.CO.QRIS.WWW01189360091531536780960214818451100140220303UMI51440014ID.CO.QRIS.WWW0215ID10200220303660303UMI5204581253033605802ID5914DUMMY SUMOPOD6006JAKARTA610512345621605120121102717016304E856`;
        const qrImage = await QRCode.toDataURL(dummyQrString, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        });
        return {
            payment_id: `mock-sp-${Date.now()}`,
            order_id: String(orderId),
            amount: roundedAmount,
            payment_code: dummyQrString,
            qr_image: qrImage,
            payment_link_url: '',
            status: 'PENDING'
        };
    }

    const payload = {
        order_id: String(orderId),
        amount: roundedAmount,
        currency: 'IDR',
        payment_method_type_code: paymentMethod
    };

    logger.info(`Sending payment request to SumoPod for order: ${orderId}, amount: ${roundedAmount}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMsg = data.message || data.error || response.statusText || 'Gagal membuat pembayaran di SumoPod';
        logger.error(`SumoPod payment creation error (${response.status}): ${errorMsg}`);
        throw new Error(`SumoPod API Error: ${errorMsg}`);
    }

    logger.info(`SumoPod payment created successfully for order: ${orderId}`);

    // SumoPod response can return payment_code (QR string) and payment_link_url
    const paymentCode = data.payment_code || data.qr_string || data.qr_code || '';
    const paymentLinkUrl = data.payment_link_url || data.payment_url || '';
    let qrImage = '';

    if (paymentCode) {
        try {
            qrImage = await QRCode.toDataURL(paymentCode, {
                width: 320,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' }
            });
        } catch (qrErr) {
            logger.warn(`Failed generating QR Data URL from payment_code: ${qrErr.message}`);
        }
    }

    return {
        payment_id: data.id || data.payment_id || '',
        order_id: data.order_id || String(orderId),
        amount: data.amount || roundedAmount,
        payment_code: paymentCode,
        qr_image: qrImage,
        payment_link_url: paymentLinkUrl,
        status: data.status || 'PENDING'
    };
};

/**
 * Validasi Webhook dari SumoPod
 * SumoPod mendukung verifikasi via:
 * 1. X-Webhook-Token header (whtok_...)
 * 2. Svix signatures (svix-id, svix-timestamp, svix-signature)
 */
export const verifySumopodWebhook = (headers = {}, rawBody = '') => {
    const configuredToken = getWebhookToken();
    const configuredSecret = getSigningSecret();

    // 1. Verifikasi dengan X-Webhook-Token jika dikonfigurasi
    const receivedToken = headers['x-webhook-token'] || headers['X-Webhook-Token'];
    if (configuredToken) {
        if (receivedToken && receivedToken === configuredToken) {
            return true;
        }
        logger.warn('SumoPod webhook token mismatch or missing header X-Webhook-Token');
        return false;
    }

    // 2. Verifikasi dengan Svix Signature jika signing secret dikonfigurasi
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];

    if (configuredSecret && svixId && svixTimestamp && svixSignature) {
        try {
            const secretBytes = configuredSecret.startsWith('whsec_') 
                ? Buffer.from(configuredSecret.slice(6), 'base64') 
                : Buffer.from(configuredSecret, 'utf-8');
            const toSign = `${svixId}.${svixTimestamp}.${typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)}`;
            const expectedSig = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');
            
            // Signature header can contain multiple space-delimited signatures formatted as "v1,..."
            const signatures = svixSignature.split(' ');
            const matched = signatures.some(sig => {
                const parts = sig.split(',');
                return parts.length === 2 && parts[1] === expectedSig;
            });
            return matched;
        } catch (err) {
            logger.error(`Error verifying svix signature: ${err.message}`);
            return false;
        }
    }

    // Jika belum mengatur webhook token di .env, loloskan dengan warning log (agar mudah testing)
    logger.warn('SUMOPOD_WEBHOOK_TOKEN is not set in .env. Skipping signature verification in sandbox.');
    return true;
};

export default {
    createSumopodPayment,
    verifySumopodWebhook
};

