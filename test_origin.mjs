import WebSocket from 'ws';

const token = 'rmho1f9w8otauiapvczmjyu359cvd06x5izp4drr73bwm81u';
const url = `ws://180.76.133.26:18789?token=${token}`;

// We simulate a browser connection passing Origin
const ws = new WebSocket(url, {
    headers: {
        'Origin': 'http://localhost:5173'
    }
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('<-', JSON.stringify(msg));

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
                scopes: ['operator.read', 'operator.write'],
                auth: { token },
            }
        };
        console.log('->', JSON.stringify(req));
        ws.send(JSON.stringify(req));
    }
});
