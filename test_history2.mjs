import WebSocket from 'ws';

const token = 'rmho1f9w8otauiapvczmjyu359cvd06x5izp4drr73bwm81u';
const url = `ws://180.76.133.26:18789?token=${token}`;

const ws = new WebSocket(url);

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('<-', JSON.stringify(msg));

    if (msg.id === 'conn-1' && msg.ok) {
        console.log('\n--- AUTHENTICATED! ---\n');
        
        // Let's try to query the schema of available methods
        const rpcMethods = {
            type: 'req',
            id: 'req-schema',
            method: 'rpc.discover',
            params: {}
        };
        console.log('->', JSON.stringify(rpcMethods));
        ws.send(JSON.stringify(rpcMethods));

        // Fetch sessions
        const fetchReq = {
            type: 'req',
            id: 'req-sessions-1',
            method: 'sessions.list',
            params: { limit: 10 }
        };
        console.log('->', JSON.stringify(fetchReq));
        ws.send(JSON.stringify(fetchReq));
    }

    if (msg.id === 'req-sessions-1' && msg.ok) {
        const sessions = msg.payload.sessions || [];
        if (sessions.length > 0) {
            const sessionId = sessions[0].sessionId || sessions[0].key;
            console.log(`\n--- FETCHING HISTORY FOR ${sessionId} ---\n`);
            
            // Try sessions.read
            const histReq1 = {
                type: 'req',
                id: 'req-hist-1',
                method: 'sessions.read',
                params: { sessionId, limit: 50 }
            };
            console.log('->', JSON.stringify(histReq1));
            ws.send(JSON.stringify(histReq1));
            
            // Try sessions.get
            const histReq2 = {
                type: 'req',
                id: 'req-hist-2',
                method: 'sessions.get',
                params: { sessionId }
            };
            console.log('->', JSON.stringify(histReq2));
            ws.send(JSON.stringify(histReq2));
        }
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
        console.log('->', JSON.stringify(req));
        ws.send(JSON.stringify(req));
    }
});
ws.on('close', () => process.exit(0));
