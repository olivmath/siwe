import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

const BACKEND_ADDR = "http://localhost:8000";
const domain = "localhost";
const origin = window.location.origin;

let nonce = null;
let message = null;
let signature = null;
let signer;
const provider = new BrowserProvider(window.ethereum);

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.onclick = connectAndLogin;
logoutBtn.onclick = logout;

async function createSiweMessage(address, statement, nonce) {
    let message = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: "1",
        chainId: 31337,
        nonce: nonce
    });
    message = message.prepareMessage();
    return message;
}

async function connectAndLogin() {
    const localToken = localStorage.getItem("token");
    if (localToken) {
        alert('Already logged in.');
        return
    }
    try {
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        const response = await fetch(`${BACKEND_ADDR}/login/nonce/${signer.address}`, { method: "GET" });
        const res = await response.json();
        nonce = res.nonce;
        message = await createSiweMessage(signer.address, 'vc esta entrando', nonce);
        signature = await signer.signMessage(message);

        await sendForVerification();
    } catch (error) {
        console.log('Error connecting or logging in:', error);
    }
}

async function sendForVerification() {
    const res = await fetch(`${BACKEND_ADDR}/login/signin/${signer.address}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature })
    });
    const data = await res.json();
    alert(JSON.stringify(data));

    if (data.token !== undefined) {
        localStorage.setItem("token", data.token);
    }
}

async function logout() {
    const localToken = localStorage.getItem("token");
    if (localToken) {
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        const res = await fetch(`${BACKEND_ADDR}/login/signout/${signer.address}`, {
            method: "GET",
            headers: {
                "X-Authorization": localToken
            }
        });
        localStorage.setItem("token", "");
        const data = await res.json();
        alert(JSON.stringify(data));
    } else {
        alert('No token found. Already logged out.');
    }
}
