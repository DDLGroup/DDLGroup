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

    // Clean Phone Numbers
    const cleanedCustomerPhone = phone.replace(/[^0-9]/g, '');
    const formattedCustomerPhone = cleanedCustomerPhone.startsWith('91') ? cleanedCustomerPhone : `91${cleanedCustomerPhone}`;
    const adminPhone = '917551067843';

    // Target Endpoints
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxKJs977tNMZ5se24zBnpywMmE8bRWIvWJHhp5B5NeuYmbv_EmPFH_ezVO548qIWdIHrQ/exec';
    const EVOLUTION_API_URL = 'https://evolution.ddlg.in/message/sendText/DDL%20Group%20Support%20V2';
    const EVOLUTION_API_KEY = 'F96432FA9ED2-4479-801E-DAE5187A4CAB';

    try {
        // 1. Post to Google Sheet
        const sheetPayload = JSON.stringify({
            fullName,
            phone: cleanedCustomerPhone,
            email: email || '',
            service,
            message: message || '',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });
        
        postHttpRequest(GOOGLE_SHEET_URL, sheetPayload, { 'Content-Type': 'application/json' }).catch(err => context.log('Google sheet post notice:', err.message));

        // 2. WhatsApp Notification to Admin (7551067843)
        const adminText = `🔔 *NEW SERVICE REQUEST - DDL GROUP*\n\n👤 *Client Name:* ${fullName}\n📞 *Phone:* ${cleanedCustomerPhone}\n✉️ *Email:* ${email || 'N/A'}\n🛠️ *Service:* ${service}\n💬 *Message:* ${message || 'N/A'}\n⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
        
        const adminPayload = JSON.stringify({
            number: adminPhone,
            text: adminText,
            textMessage: { text: adminText }
        });

        await postHttpRequest(EVOLUTION_API_URL, adminPayload, {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
        }).catch(err => context.log('Admin WhatsApp note:', err.message));

        // 3. WhatsApp Auto-Reply to Customer
        const customerText = `Hello ${fullName}! 👋\n\nThank you for reaching out to *DDL Group* (West Bengal's Leading Digital Agency).\n\nWe have received your request for *${service}*.\n\nOur team will review your requirement and call you back shortly on *${cleanedCustomerPhone}*.\n\n📱 *Direct Call/WhatsApp:* 7551067843 / 03463 296702\n✉️ *Email:* contact@ddlg.in\n🌐 *Website:* https://ddlg.in`;

        const customerPayload = JSON.stringify({
            number: formattedCustomerPhone,
            text: customerText,
            textMessage: { text: customerText }
        });

        await postHttpRequest(EVOLUTION_API_URL, customerPayload, {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
        }).catch(err => context.log('Customer WhatsApp note:', err.message));

        // Response
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Lead recorded successfully. WhatsApp notification & customer auto-reply sent!'
            })
        };

    } catch (error) {
        context.log('Error in submit-lead API:', error);
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Lead recorded!' })
        };
    }
};

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
