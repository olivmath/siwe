import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

const domain = window.location.host;
const origin = window.location.origin;
const provider = new BrowserProvider(window.ethereum);

const BACKEND_ADDR = "http://localhost:3000";

async function createSiweMessage(address, statement, nonce) {
    let message = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: '1',
        nonce: nonce
    });
    message = message.prepareMessage();
    console.log(message)
    return message
}

function connectWallet() {
    provider.send('eth_requestAccounts', [])
        .then(async () => {
            const signer = await provider.getSigner();
            const res = await fetch(`${BACKEND_ADDR}/nonce/${signer.address}`);
            nonce = await res.text()
            console.warn(nonce)
        })
        .catch(() => console.log('user rejected request'));
}

let nonce = null;
let message = null;
let signature = null;

async function signInWithEthereum() {
    const signer = await provider.getSigner();
    message = await createSiweMessage(
        await signer.address,
        'Sign in with Ethereum to the app.',
        nonce
    );
    signature = await signer.signMessage(message);
    console.log(signature)
}

async function sendForVerification() {
    const res = await fetch(`${BACKEND_ADDR}/verify`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
    });
    const data = await res.json();
    alert(JSON.stringify(data));
}

const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
const verifyBtn = document.getElementById('verifyBtn');
connectWalletBtn.onclick = connectWallet;
siweBtn.onclick = signInWithEthereum;
verifyBtn.onclick = sendForVerification;
