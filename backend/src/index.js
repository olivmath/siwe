import cors from "cors";
import express from "express";
import { generateNonce, SiweMessage } from "siwe";
import jwt from "jsonwebtoken";

const PORT = 3000;
const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = "minha-chave-secreta";
const userNonces = {};

app.get("/nonce/:address", (req, res) => {
  const { address } = req.params;
  const nonce = generateNonce();
  userNonces[address] = nonce;
  console.log("Nonces:", userNonces);
  res.json({ nonce });
});

app.post("/login/signin/:address", async (req, res) => {
  const { message, signature } = req.body;

  try {
    const siweMessage = new SiweMessage(message);

    const sessionNonce = validateSiweMessage(siweMessage);

    await siweMessage.verify({ signature });

    const token = jwt.sign(
      { address: siweMessage.address, nonce: sessionNonce },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.json({ message: true, token });
  } catch (error) {
    console.error("Erro ao verificar a mensagem:", error);
    return res
      .status(400)
      .json({ message: false, error: "Erro na verificação" });
  }
});

app.post("/logout", (req, res) => {
  const token = req.headers["x-authorization"];

  if (!token) {
    return res.status(400).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const { address } = decoded;
    userNonces[address] = generateNonce();

    return res.json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    return res.status(400).json({ message: "Token inválido ou expirado" });
  }
});

// Route to serve a dynamic HTML page with the user's address
app.get("/protected", middlewareAuthenticateToken, (req, res) => {
  const userAddress = req.user.address;

  // Dynamically create the HTML with the user's address
  const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Protected Page</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                    padding: 2rem;
                    background-color: #f4f4f4;
                }
                h1 {
                    color: #4CAF50;
                }
                p {
                    color: #555;
                }
            </style>
        </head>
        <body>
            <h1>Welcome to the Protected Page!</h1>
            <p>Your address: <strong>${userAddress}</strong></p>
            <p>This content is only visible to authenticated users.</p>
            <button onclick="location.reload()">Come back to auth page</button>
        </body>
        </html>
    `;

  res.send(htmlContent);
});

function middlewareAuthenticateToken(req, res, next) {
  const token = req.headers["x-authorization"];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { address, nonce } = decoded;

    if (userNonces[address] !== nonce) {
      return res.status(403).json({ message: "Sessão inválida" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido ou expirado" });
  }
}

function validateSiweMessage(msg) {
  if (userNonces[msg.address] !== msg.nonce) {
    return res
      .status(400)
      .json({ message: false, error: "Nonce inválido ou expirado" });
  }

  const sessionNonce = generateNonce();
  userNonces[msg.address] = sessionNonce;
  return sessionNonce;
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
