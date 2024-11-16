require('dotenv').config();

const { ethers } = require('ethers');
const { Client } = require("@xmtp/xmtp-js");
// const { Client } = require("@xmtp/node-sdk");

const { ekta } = require('viem/chains');

const privateKey = process.env.WALLET_KEY;
const provider = ethers.getDefaultProvider('mainnet');
const wallet = new ethers.Wallet(privateKey, provider);

const conversations = new Map();

let xmtp;
(async () => {
    try {
        xmtp = await Client.create(wallet, { env: "production" });
        // await xmtp.conversations.sync();

        console.log('XMTP client initialized');
        const existConversations = await xmtp.conversations.list();

        for (let i = 0; i < existConversations.length; i++) {
            const conv = await xmtp.conversations.updateV2Conversations(existConversations[i].address);
            conversations.set(existConversations[i].address, conv);
        }
        
    } catch (error) {
        console.error('Failed to initialize XMTP client:', error);
    }
})();



async function sendMessage(address, msg) {
    try {
        console.log('Sending message to:', address);
        let conv;
        if (conversations.has(address)) {
            conv = conversations.get(address);
        } else {
            console.log('Creating new conversation with:', address);
            // conv = await xmtp.conversations.newDm(address);
            conv = await xmtp.conversations.newConversation(address);
            conversations.set(address, conv);
        }
        
        // const conv = await xmtp.conversations.newConversation(address);
        console.log('message sent at ', new Date());
        return await conv.send(msg);
    } catch(e) {
        console.log(e)
    }
}

async function broadCastSubscribers(subscribers, msg) {
    let canMessageAddresses = [];

    let errorCount = 0;
    for (let i = 0; i < subscribers.length; i++) {
        try {
            await sendMessage(subscribers[i], msg);
        } catch (error) {
            errorCount++;
            console.error('Failed to send message to:', subscribers[i], error);
        }
    }
    
    
    // for (let i = 0; i < canMessageAddresses.length; i++) {
        //     if (canMessageAddresses[i]) {
            //       batch.push(broadcastAddresses[i]);
            //     }
            //     // Add a batch of 500 addresses to the batches array
            //     // An introduction message is sent for new contacts, so each new message will actually be 2 messages in this case
            //     // We want to send 1000 messages per minute, so we split the batches in half
            //     // Additional optimization can be done to send messages to contacts that have already been introduced
            //     if (batch.length === XMTP_RATE_LIMIT) {
                //       batches.push(batch);
                //       batch = [];
    //     }
    //   }
    //   if (batch.length > 0) {
    //     batches.push(batch);
    //   }
}

module.exports = { sendMessage, broadCastSubscribers };