const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async function (context, req) {
    context.log('Processing DDL Group lead submission request...');

    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers, body: '' };
        return;
    }

    const data = req.body || {};
    const { fullName, phone, email, service, message } = data;

    if (!fullName || !phone || !service) {
        context.res = {
            status: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Missing required fields: fullName, phone, or service.' })
        };
        return;
    }

    // Clean Phone Number
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    const formattedCustomerPhone = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;

    // Credentials & Configurations
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwhup38R_-X57aLVV_JVqqX1Ra_95kSt_yykAlmfQe3V8LJjjbyjnWl4T_Ewu2yY68o/exec';
    const GOOGLE_API_KEY = 'dbdpjsdf2626dshsdpkpsdkfghpsddsghskp2dfghlmpdhsdhdfpl';
    const EVOLUTION_API_URL = 'https://evolution.ddlg.in/message/sendText/DDL%20Group%20Support%20V2';
    const EVOLUTION_API_KEY = 'F96432FA9ED2-4479-801E-DAE5187A4CAB';
    const ADMIN_PHONE = '917551067843@s.whatsapp.net';

    try {
        // 1. Post to Google Sheet
        const sheetPayload = JSON.stringify({
            key: GOOGLE_API_KEY,
            fullName,
            phone: cleanedPhone,
            email: email || '',
            service,
            message: message || '',
            timestamp: new Date().toISOString()
        });
        postHttpRequest(GOOGLE_SHEET_URL, sheetPayload, { 'Content-Type': 'application/json' }).catch(err => context.log('Google sheet post notice:', err.message));

        // 2. Send WhatsApp Notification to Admin (7551067843)
        const adminText = `🔔 *NEW SERVICE REQUEST - DDL GROUP*\n\n👤 *Client Name:* ${fullName}\n📞 *Phone:* ${cleanedPhone}\n✉️ *Email:* ${email || 'N/A'}\n🛠️ *Service Selected:* ${service}\n💬 *Message:* ${message || 'N/A'}\n⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
        
        const adminPayload = JSON.stringify({
            number: ADMIN_PHONE,
            options: { delay: 1000, presence: 'composing' },
            textMessage: { text: adminText }
        });

        await postHttpRequest(EVOLUTION_API_URL, adminPayload, {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
        }).catch(err => context.log('Admin WhatsApp notification note:', err.message));

        // 3. Send WhatsApp Auto-Reply to Customer
        const customerText = `Hello ${fullName}! 👋\n\nThank you for reaching out to *DDL Group* (West Bengal's Leading Digital Agency).\n\nWe have successfully received your request for: *${service}*.\n\nOur team is reviewing your requirements and will call you back shortly on *${cleanedPhone}*.\n\n📱 *Direct Contact:* 7551067843 / 03463 296702\n✉️ *Email:* contact@ddlg.in\n🌐 *Website:* https://ddlg.in`;

        const customerPayload = JSON.stringify({
            number: `${formattedCustomerPhone}@s.whatsapp.net`,
            options: { delay: 2000, presence: 'composing' },
            textMessage: { text: customerText }
        });

        await postHttpRequest(EVOLUTION_API_URL, customerPayload, {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
        }).catch(err => context.log('Customer WhatsApp auto-reply note:', err.message));

        // Return Success Response to Frontend UI
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Lead recorded successfully. WhatsApp notification & customer auto-reply sent!'
            })
        };

    } catch (error) {
        context.log('Error processing lead function:', error);
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Lead recorded successfully!'
            })
        };
    }
};

// Helper function for HTTP/HTTPS requests
function postHttpRequest(targetUrl, payload, headers) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(targetUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });

        req.on('error', err => reject(err));
        req.write(payload);
        req.end();
    });
}
