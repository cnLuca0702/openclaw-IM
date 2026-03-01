import crypto from 'crypto';
import WebSocket from 'ws';

function generateDeviceAuth(nonceStr) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    // OpenClaw usually uses hex or base58 for ed25519 keys. Let's try hex first.
    // Or base64? Let's try hex representation of raw bytes
    const pubKeyHex = publicKey.export({ format: 'der', type: 'spki' }).toString('hex');

    // For Ed25519, the actual raw key is the last 32 bytes of the SPKI format.
    const rawPubKey = publicKey.export({ format: 'der', type: 'spki' }).slice(-32);
    const pubKeyStr = rawPubKey.toString('hex');

    // Many systems use "ed25519:" prefix or just hex for id
    const deviceId = pubKeyStr;

    const signedAt = Date.now();
    // What is signed? Usually the nonce, or nonce + signedAt
    const message = Buffer.from(`${nonceStr}`);
    const signature = crypto.sign(null, message, privateKey).toString('hex');

    return {
        id: deviceId, // might need to be exactly the pubkey? we will try generating a predictable string.
        publicKey: pubKeyStr,
        signature: signature,
        signedAt: signedAt,
        nonce: nonceStr
    };
}

const token = 'rmho1f9w8otauiapvczmjyu359cvd06x5izp4drr73bwm81u';
const url = `ws://180.76.133.26:18789`;
const ws = new WebSocket(url);

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('<-', JSON.stringify(msg));

    if (msg.id === 'conn-1' && msg.ok) {
        console.log('\n--- AUTHENTICATED! ---\n');
        // Now fetch sessions
        const fetchReq = {
            type: 'req',
            id: 'req-sessions-1',
            method: 'sessions.list',
            params: { limit: 100 }
        };
        console.log('->', JSON.stringify(fetchReq));
        ws.send(JSON.stringify(fetchReq));
    }

    if (msg.event === 'connect.challenge') {
        const deviceAuth = generateDeviceAuth(msg.payload.nonce);
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
                auth: { token }
            }
        };
        console.log('->', JSON.stringify(req));
        ws.send(JSON.stringify(req));
    }
});
ws.on('close', (code, reason) => console.log('Closed', code, reason.toString()));
ws.on('error', console.error);
