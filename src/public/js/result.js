const results_div = document.getElementById('results');
const count_span = document.getElementById('counter');
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
                addResult(response.url, response.code);
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


function addResult(path, status) {
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
    
    
    item.innerHTML = `
        <span class="dir">/${path}</span>
        <span class="${status_class}">[${status}]</span>
    `;
    
    results_div.appendChild(item);


    count_span.innerText = `Найдено: ${results_div.children.length}`;
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