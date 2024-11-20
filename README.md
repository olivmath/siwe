# Proof of Concept (PoC) Implementation of Sign In With Ethereum (SIWE)

- Ref: https://eips.ethereum.org/EIPS/eip-4361

## Diagram

![Untitled-3](https://github.com/user-attachments/assets/8563b814-1692-4cd1-954b-ba90952feca4)

```
title Sign-in process [SIWE]

actor User
participant Wallet
participant Frontend
participant Backend
database Database


User->Frontend: click in loggin
Frontend->Wallet: `eth_requestAccount`
Wallet->User: connect wallet?
User->Wallet: yes
Wallet->Frontend: show user address\nsend a signer connection
Frontend->Backend: /login/nonce/{userAddress}
Backend->Backend: Generate new nonce
Backend->Database: Save {address: nonce}
Backend->Frontend: nonce
Frontend->Frontend: build a message\nFollowing eip4361
Frontend->Wallet: Sign this message
Wallet->User: sign?
User->Wallet: yes
Wallet->Frontend: signature
Frontend->Backend: save signature /login/signin/{userAddress}
Backend->Database: get nonce by address
Backend->Backend: verify signature\nagain address + nonce\nGenerate JWT token
Backend->Database: save token to address
Backend->Frontend: 200 OK
Frontend->Frontend: Save Token in localstorage
Frontend->User: You are Loged!
```


## Frontend

## Backend
