require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const app = express();
const PORT = process.env.PORT || 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';



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
            res.status(200).send('Webhook received');
        });
    });
});

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
});


