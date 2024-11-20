import { BrowserProvider } from "ethers";
import { SiweMessage } from "siwe";

const BACKEND_ADDR = "http://localhost:3000";
const domain = "localhost";
const origin = window.location.origin;

let nonce = null;
let message = null;
let signature = null;
let signer;
const provider = new BrowserProvider(window.ethereum);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const protectedBtn = document.getElementById("protectedBtn");

loginBtn.onclick = connectAndLogin;
logoutBtn.onclick = logout;
protectedBtn.onclick = accessProtectedRoute;

/**
 * Create a SIWE message with the given address, statement, and nonce.
 */
async function createSiweMessage(address, statement, nonce) {
  const siweMessage = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: "1",
    chainId: 31337,
    nonce: nonce,
  });
  return siweMessage.prepareMessage();
}

/**
 * Connect to the wallet, fetch a nonce, sign a SIWE message, and log in.
 */
async function connectAndLogin() {
  const localToken = localStorage.getItem("token");
  if (localToken) {
    alert("Already logged in.");
    return;
  }

  try {
    // Connect to wallet
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    // Fetch nonce from the backend
    const response = await fetch(`${BACKEND_ADDR}/nonce/${signer.address}`, {
      method: "GET",
    });
    const res = await response.json();
    nonce = res.nonce;

    console.log("request signature...");
    // Create and sign the SIWE message
    message = await createSiweMessage(
      signer.address,
      "YOU ARE LOGGIN USING YOUR WALLET TO SIGN THIS MESSAGE!",
      nonce
    );
    signature = await signer.signMessage(message);

    // Verify and obtain token
    await sendForVerification();
  } catch (error) {
    console.error("Error during login:", error);
  }
}

/**
 * Send the signed SIWE message to the backend for verification and receive a JWT.
 */
async function sendForVerification() {
  const res = await fetch(`${BACKEND_ADDR}/login/signin/${signer.address}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, signature }),
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    alert("Login successful.");
  } else {
    alert("Login failed: " + data.error);
  }
}

/**
 * Logout by invalidating the token in the backend and clearing it locally.
 */
async function logout() {
  const localToken = localStorage.getItem("token");
  if (!localToken) {
    alert("No token found. Already logged out.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_ADDR}/logout`, {
      method: "POST",
      headers: {
        "X-Authorization": localToken,
      },
    });

    const data = await res.json();
    localStorage.removeItem("token");
    alert(data.message || "Logout successful.");
  } catch (error) {
    console.error("Error during logout:", error);
  }
}

/**
 * Access a protected route using the stored token.
 */
async function accessProtectedRoute() {
  const localToken = localStorage.getItem("token");
  if (!localToken) {
    alert("You must be logged in to access this route.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_ADDR}/protected`, {
      method: "GET",
      headers: {
        "X-Authorization": localToken,
      },
    });

    const data = await res.text();
    document.open();
    document.write(data);
    document.close();
  } catch (error) {
    console.error("Error accessing protected route:", error);
  }
}
