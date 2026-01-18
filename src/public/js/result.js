const results_div = document.getElementById('results');
const header_results_div = document.getElementById("header-results");
const count_span = document.getElementById('counter');
const header_counter = document.getElementById('header-counter')
const target = document.getElementById('target-input');
const scan_button = document.getElementById("start-scan-button");

target.value = localStorage.getItem("last_input");

// websocket here

const ws = new WebSocket("ws://localhost");
set_loading(true)

ws.onopen = () => {
    ws.send(JSON.stringify({action: "init", session: localStorage.getItem("session")}));
    set_loading(false);

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data)
        switch (response.action) {
            case "add":
                addResult(results_div, response.url, response.code);
                break;
            case "headers":
                if (response.error) break;

                for (let header of response.headers) {
                    console.log(header);
                    addResult(header_results_div, header[0], header[1] || "❌", true);
                }

                break;
            case "session":
                localStorage.setItem("session", response.session);
                break;
            case "finish":
                set_loading(false);
                scanning = false;
                scan_button.innerText = "Начать скан";
                break;
        }
    }
}

function set_loading(value) {
    document.getElementById("left-bottom-spinner-background").style.display = value ? "flex" : "none";
}


function addResult(results_div, path, status, is_header) {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    if (!path) {
        item.innerHTML = `
            <span class="dir">Не найдены уязвимые директории</span>
            
        `;
        results_div.appendChild(item);
        return;
    } 

    let status_class = null;
    if (status.toString()[0] === "2") {
        status_class = "status-200";
    } else if (status.toString()[0] === "3") {
        status_class = "status-redirect-404"
    } else {
        status_class = "status-403"
    }
    

    if (is_header) {
        item.innerHTML = `
            <span class="dir">${path}</span>
            <span>⠀</span>
            <span class="dir">${status}</span>
        `;
    } else {
        item.innerHTML = `
            <span class="dir">/${path}</span>
            <span class="${status_class}">[${status}]</span>
        `;
    }
    
    
    results_div.appendChild(item);

    if (is_header) {
        header_counter.innerText = `Найдено: ${results_div.children.length}`;
    } else {
        count_span.innerText = `Найдено: ${results_div.children.length}`;
    }
    
    results_div.scrollTop = results_div.scrollHeight;
}

let scanning = false;

async function start_scan() {
    let target_resource = target.value;
    if (target_resource.at(-1) === "/") {
        target_resource = target_resource.slice(0, -1);
    }

    if (!target_resource) {
        return;
    }

    if (scanning) {
        ws.send(JSON.stringify({ action: "stop", session: localStorage.getItem("session") }));
        scan_button.innerText = "Начать скан";

        set_loading(false);
        scanning = false;

        return;
    };


    scanning = true;
    scan_button.innerText = "Остановить скан";

    localStorage.setItem("last_input", target_resource);


    count_span.innerText = "Найдено: 0";
    results_div.innerHTML = "";
    header_results_div.innerHTML = "";
    
    set_loading(true);

    try {
        ws.send(JSON.stringify({ resource: target_resource, action: "scan", session: localStorage.getItem("session") }))
    } catch (err) {
        console.warn(err)
    }
    

}

scan_button.addEventListener('click', () => {
    start_scan(); 
});