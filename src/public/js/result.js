const results_div = document.getElementById('results');
const count_span = document.getElementById('counter');
const target = document.getElementById('target-input');
const scan_button = document.getElementById("start-scan-button");

target.value = localStorage.getItem("last_input");


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

    if (scanning) return;

    scanning = true;

    localStorage.setItem("last_input", target_resource);


    count_span.innerText = "Найдено: 0";
    results_div.innerHTML = "";
    
    set_loading(true);

    try {
        const response = await fetch("/scan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({url: target_resource})
        });

        const data = await response.json();

        for (let path of data.content) {
            addResult(path.url, path.code);
        }

        if (!data.content[0]) {
            addResult(false);
        }
    } catch (err) {
        console.warn(err)
    }
    

    set_loading(false);

    scanning = false;

}

scan_button.addEventListener('click', () => {
    start_scan(); 
});