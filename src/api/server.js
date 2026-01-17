import { config } from "dotenv";
config();


import express from "express";
import helmet from "helmet";
import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { scan_dirs } from "./word_lists.js";


const app = express();

app.use(express.json());
app.use(helmet());


app.use("/", express.static(path.join(__dirname, "..", "public")));


app.post("/scan", async (req, res) => {

    const resource = req.body.url;
    let found_dirs = [];

    if (!resource || !resource.match(/^https?:\/\/.+/)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }


    for (let dir of scan_dirs.split("\n")) {
        const url = `${resource}/${dir}`;
        try {
            
            const response = await axios.head(url, { 
                timeout: 500, 
                validateStatus: (status) => status < 404
            });
            
            if (response.status.toString()[0] !== "1") {
                found_dirs.push({ url: dir, code: response.status });
                console.log("FOUND", url);
            }
        } catch (err) {
            console.log(`scanned ${url}, ${err}`);
        }
    }

    res.status(200).json({ok: true, content: found_dirs})
});



const port = process.env.SCANNER_PORT;
app.listen(port, () => {
    console.log(`Сканер запущен на порте ${port}`);
});