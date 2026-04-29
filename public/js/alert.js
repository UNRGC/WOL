const spawnAlert = (title, message, icon, timer = 3000) => {
    const alert = document.createElement("div");
    alert.classList.add("alert");

    const heading = document.createElement("h3");
    const iconElement = document.createElement("i");
    iconElement.className = `bi bi-${icon}`;
    heading.append(iconElement, document.createTextNode(` ${title}`));

    const paragraph = document.createElement("p");
    paragraph.id = "alert-message";
    paragraph.textContent = message;

    alert.append(heading, paragraph);
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.classList.add("dispose");
        alert.addEventListener("animationend", () => {
            alert.remove();
        });
    }, timer);
};

export default spawnAlert;
