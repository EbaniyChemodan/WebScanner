import { config } from "dotenv";
config();

import express from "express"

const app = express();

const secret_paths = ['/admin', '/config', '/.env', '/backup', '/db'];

secret_paths.forEach(p => {
    app.get(p, (req, res) => {
        res.status(200).send(`тут что то есть))`);
    });
});

app.get('/private', (req, res) => {
    res.status(403).send('сюда нельзя');
});


const port = process.env.VULNERABLE_SERVER_PORT || 3000
app.listen(port, () => {
    console.log(`Уязвимый сервер запущен на порте ${port}`);
});