import { config } from "dotenv";
config();


import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer } from 'http'
import { WebSocketServer } from "ws";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { scan_dirs } from "./word_lists.js";


let scans = {}; // store sessions

const security_headers = [
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options', 
    'Content-Security-Policy',
    'X-XSS-Protection',
    'Referrer-Policy'
];


async function brute(data) {
    const resource = data.resource;
    let found_dirs = [];

    scans[data.session].is_scan_stopped = false;

    if (!resource || !resource.match(/^https?:\/\/.+/)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }


    for (let dir of scan_dirs.split("\n")) {
        if (scans[data.session].is_scan_stopped) break;
        const url = `${resource}/${dir}`;
        try {
            
            const response = await axios.head(url, { 
                timeout: data.timeout || 200, 
                validateStatus: (status) => status < 404
            });
            
            if (response.status.toString()[0] !== "1") {
                found_dirs.push({ url: dir, code: response.status });
                scans[data.session].ws.send(JSON.stringify({ url: dir, code: response.status, action: "add" }));
                console.log("FOUND", url);
            }
        } catch (err) {
            // console.log(`scanned ${url}, ${err}`);
        }
    }

    scans[data.session].ws.send(JSON.stringify({ action: "finish" }));
    return found_dirs;
}


async function scan_headers(data) {
    try {
        const response = await axios.head(data.resource, { 
            timeout: data.timeout || 200, 
            validateStatus: (status) => status
        });

        const headers = response.headers;
        
        const results = [];
    
        
        security_headers.forEach(header => {
            const key = header.toLowerCase();
            results.push([header, headers[key] || null]);
        });
        

        scans[data.session].ws.send(JSON.stringify({ action: "headers", headers: results }));

        return results;
        
    } catch (error) {
        scans[data.session].ws.send(JSON.stringify({ action: "headers", error: true, message: "Headers check failed!" }));
        console.warn("Check failed", error.message)
    }
}


const app = express();

const server = createServer(app);
const wss = new WebSocketServer({ server });


wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const parsed_message = JSON.parse(message.toString());
        /*
        {
            resource: string?
            timeout: number?
            action: "scan" | "stop" | "init"
            session: string?
        }
        */
        switch (parsed_message.action) {
            case "scan":
                if (!parsed_message.session) return;
                scan_headers(parsed_message);
                brute(parsed_message);
                break;
            case "init":
                let session = parsed_message.session;
                if (!session || !scans[session]) {
                    session = crypto.randomBytes(16).toString('hex');
                    ws.send(JSON.stringify({ action: "session", session: session }));

                    scans[session] = {ws: ws, is_scan_stopped: true};
                    return;
                }
                scans[session].ws = ws;
                break;
            case "stop":
                scans[parsed_message.session].is_scan_stopped = true;
                break;
            default:
                break;
        }
        
    });
})

app.use("/", express.static(path.join(__dirname, "..", "public"))); // to serve statics


const port = process.env.SCANNER_PORT || 80;
server.listen(port, () => {
    console.log(`Сканер запущен на порте ${port}`);
});