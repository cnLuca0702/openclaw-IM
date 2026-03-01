import WebSocket from 'ws';

const token = 'rmho1f9w8otauiapvczmjyu359cvd06x5izp4drr73bwm81u';
const url = `ws://180.76.133.26:18789?token=${token}`;

const ws = new WebSocket(url);

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.id === 'conn-1' && msg.ok) {
        console.log('\n--- SERVER METHODS ---');
        console.log(JSON.stringify(msg.payload.features.methods, null, 2));
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
