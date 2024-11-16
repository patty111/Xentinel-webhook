require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { sendEmail } = require('./smtp');

const app = express();
const PORT = process.env.PORT || 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// db
const { turso } = require('./db/db');

// xmtp
const { sendMessage, checkGroupMessageValid, broadCastSubscribers } = require('./xmtp');


// Middleware to parse JSON bodies
app.use(bodyParser.json());

let subscribers = [];
let subscriber_email = [];


app.get('/healthcheck', async (req, res) => {
    res.status(200).send();
});


app.post('/webhook', async (req, res) => {
    console.log('Received webhook:', req.body);

    let msg = JSON.stringify(req.body);

    // console.log(req.body.events[0].hash);
    msg = req.body.events[0].transaction;
    msg = msgBuilder(req.body.events);
    console.log('msg:', msg);
    
    res.status(200).send('Webhook received, msg sent to subscribers');
    
    subscribers = (await turso.execute("SELECT address FROM subscribers")).rows;
    subscribers = (subscribers.map(sub => sub.address));

    subscriber_email = (await turso.execute("SELECT email FROM subscribers")).rows;
    subscriber_email = subscriber_email.filter(row => row.email && row.email.trim() !== '').map(row => row.email);
    console.log('subscriber_email:', subscriber_email);

    await sendEmail(subscriber_email, msg);
    await broadCastSubscribers(subscribers, msg);
});

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
});

function msgBuilder(event) {
    try {
        const timestamp = event[0].timestamp;
        const hash = event[0].hash;
        const network = event[0].monitor.network;
        const chainId = event[0].monitor.chainId;
        const blockscoutUrl = `${network}.blockscout.com/tx/${hash}`;
        const multibaasUrl = `${process.env.MULTIBAAS_PROJECT_URL}/tx/${hash}`;

        // Build query parameters
        const queryParams = new URLSearchParams({
            webhook: 'true',
            hash: hash,
            chainId: chainId,
            network: network,
            timestamp: timestamp,
            blockscoutUrl: blockscoutUrl,
            multibaasUrl: multibaasUrl
        });

        return (`
    New transaction detected at ${timestamp}: \n
    Hash: ${hash}\n
    Network: ${network} (${chainId})\n
    BlockScout Explorer: ${blockscoutUrl}\n
    MultiBaas Explorer: ${multibaasUrl}\n
    Frame URL: ${process.env.FRAME_BASE_URL}?${queryParams.toString()}\n`
        );
    }
    catch (e) {
        console.error(e);
        return 'Error building message';
    }
}