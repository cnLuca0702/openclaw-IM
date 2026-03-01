import WebSocket from 'ws';

const token = 'rmho1f9w8otauiapvczmjyu359cvd06x5izp4drr73bwm81u';
const ws = new WebSocket(`ws://180.76.133.26:18789?token=${token}`);

let reqIds = {};
let sessionKey = '';

ws.onopen = () => {
    console.log('Connected.');
};

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const evt = msg.event || msg.type;

    if (evt === 'connect.challenge') {
        reqIds.auth = 'conn-1';
        ws.send(JSON.stringify({
            type: 'req',
            id: reqIds.auth,
            method: 'connect',
            params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: { id: 'webchat', version: '1.0', platform: 'web', mode: 'ui' },
                role: 'operator',
                scopes: ['operator.read', 'operator.write'],
                auth: { token }
            }
        }));
    } else if (msg.id && msg.id === reqIds.auth) {
        if (!msg.ok) { console.error('Auth failed', msg); process.exit(1); }
        console.log('Auth OK');
        reqIds.list = 'req-list-1';
        ws.send(JSON.stringify({
            type: 'req',
            id: reqIds.list,
            method: 'sessions.list',
            params: { limit: 5 }
        }));
    } else if (msg.id && msg.id === reqIds.list) {
        const items = msg.payload?.items || [];
        console.log('Sessions available:', items.map(s => s.key));
        if (items.length > 0) {
            sessionKey = items[0].key;
            // First try sending as message.send payload
            console.log('Trying event message.send with key:', sessionKey);
            ws.send(JSON.stringify({
                type: 'event',
                event: 'message.send',
                payload: {
                    sessionId: sessionKey,
                    sessionKey: sessionKey,
                    content: 'Hello World',
                    messageId: 'test-msg-1'
                }
            }));

            // Also try chat.message RPC
            reqIds.send = 'req-send-1';
            console.log('Trying req chat.message with key:', sessionKey);
            ws.send(JSON.stringify({
                type: 'req',
                id: reqIds.send,
                method: 'chat.message',
                params: {
                    sessionKey: sessionKey,
                    content: 'Hello World from chat.message'
                }
            }));

            setTimeout(() => {
                console.log('Timeout. Exiting.');
                process.exit(0);
            }, 3000);
        } else { process.exit(0); }
    } else {
        console.log('<-', JSON.stringify(msg, null, 2));
    }
};

ws.onerror = (err) => console.error('WS Error:', err);
