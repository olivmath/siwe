import cors from 'cors';
import express from 'express';
import { generateNonce, SiweMessage } from 'siwe';

const app = express();
app.use(express.json());
app.use(cors());

let validNonces = {}

app.get('/nonce/:address', function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    const address = req.params.address;
    const nonce = generateNonce();
    validNonces[address] = nonce;
    console.log(validNonces)
    res.send(nonce);
});

app.post('/verify', async function (req, res) {
    const { message, signature } = req.body;
    console.log(validNonces)
    try {
        const siweMessage = new SiweMessage(message);
        if (validNonces[siweMessage.address] !== siweMessage.nonce) {
            return res.send({ message: false });
        } else {
            validNonces[siweMessage.address] = ''
            console.log(siweMessage)
        }
        await siweMessage.verify({ signature });
        //
        //
        // # implement session 
        //
        //
        return res.send({ message: true });
    } catch {
        return res.send({ message: false });
    }
});

app.listen(3000);
