import WebSocket from 'ws';

const token = 'rmho1f9w8otauiapvczmjyu359cvd06x5izp4drr73bwm81u';
const url = `ws://180.76.133.26:18789?token=${token}`;

const ws = new WebSocket(url);

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.id === 'conn-1' && msg.ok) {
        const fetchReq = {
            type: 'req',
            id: 'req-sessions-1',
            method: 'sessions.list',
            params: { limit: 10 }
        };
        ws.send(JSON.stringify(fetchReq));
    }

    if (msg.id === 'req-sessions-1' && msg.ok) {
        const sessions = msg.payload.sessions || [];
        if (sessions.length > 0) {
            const sessionId = sessions[0].sessionId || sessions[0].key;
            console.log(`\n--- FETCHING HISTORY FOR ${sessionId} ---\n`);
            
            const histReq1 = {
                type: 'req',
                id: 'req-hist-1',
                method: 'chat.history',
                params: { sessionId, limit: 10 }
            };
            ws.send(JSON.stringify(histReq1));
        }
    }
    
    if (msg.id === 'req-hist-1') {
         console.log('Raw chat.history response:', JSON.stringify(msg, null, 2));
         ws.close();
    }

    if (msg.event === 'connect.challenge') {
        const req = {
            type: 'req',
            id: 'conn-1',
            method: 'connect',
            params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: { id: 'webchat', version: '1.0', platform: 'web', mode: 'ui' },
                role: 'operator',
                scopes: ['operator.admin', 'operator.read', 'operator.write'],
                auth: { token },
            }
        };
        ws.send(JSON.stringify(req));
    }
});
