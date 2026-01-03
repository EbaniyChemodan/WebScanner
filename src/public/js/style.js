const buttons = [...document.querySelectorAll("button")];

buttons.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.currentTarget.classList.add('btn-scan-touch');
    }, { passive: true });

    btn.addEventListener('touchend', (e) => {
        e.currentTarget.classList.remove('btn-scan-touch');
    }, { passive: true });

    btn.addEventListener('touchcancel', (e) => {
        e.currentTarget.classList.remove('btn-scan-touch');
    }, { passive: true });
});