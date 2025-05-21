const spawnAlert = (title, message, icon, timer = 3000) => {
    const alert = document.createElement("div");
    alert.classList.add("alert");
    alert.innerHTML = `
        <h3><i class="bi bi-${icon}"></i> ${title}</h3>
        <p id="alert-message">${message}</p>
    `;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.classList.add("dispose");
        alert.addEventListener("animationend", () => {
            alert.remove();
        });
    }, timer);
};

export default spawnAlert;
