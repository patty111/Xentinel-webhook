require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

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


app.get('/healthcheck', async (req, res) => {
    res.status(200).send();
});


amqp.connect(RABBITMQ_URL, (error0, connection) => {
    if (error0) {
        throw error0;
    }
    connection.createChannel((error1, channel) => {
        if (error1) {
            throw error1;
        } else {
            console.log('Connected to RabbitMQ');
        }

        const queue = 'zeppelin-defender-webhook';

        channel.assertQueue(queue, {
            durable: false
        });

        app.post('/webhook', async (req, res) => {
            console.log('Received webhook:', req.body);

            // Add a task to the queue
            let msg = JSON.stringify(req.body);
            // channel.sendToQueue(queue, Buffer.from(msg));

            msg = msgBuilder(req.body.events);
            console.log('msg:', msg);
            
            
            subscribers = (await turso.execute("SELECT address FROM subscribers")).rows;
            subscribers = (subscribers.map(sub => sub.address));


            res.status(200).send('Webhook received, msg sent to subscribers');
        });
    });
});

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
});

function msgBuilder(event) {
    const network = event[0].monitor.network === 'mainnet' ? 'eth' : event[0].monitor.network;
    return (`
New transaction detected at ${event[0].timestamp}: \n
Hash: ${event[0].hash}\n
Network: ${event[0].monitor.network} (${event[0].monitor.chainId})\n
BlockScout Explorer: ${event[0].monitor.network}.blockscout.com/tx/${event[0].hash}\n
MultiBaas Explorer: ${process.env.MULTIBAAS_PROJECT_URL}/tx/${event[0].hash}\n`
);}