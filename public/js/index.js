import spawnAlert from "./alert.js";
import { getStatus, sendWOL } from "./request.js";

// Variables
let editMode = false;
let originalMAC = null; // Para guardar la MAC original al editar

// Elementos
const btnAdd = document.getElementById("add");

const main = document.querySelector("main");
const container = document.getElementById("container");

const modalDevice = document.getElementById("modalDevice");
const formDevice = document.getElementById("formDevice");
const inputName = document.getElementById("name");
const inputMAC = document.getElementById("mac");
const inputHost = document.getElementById("host");
const inputPort = document.getElementById("port");
const inputPortStatus = document.getElementById("portStatus");
const inputTimeout = document.getElementById("timeout");

const btnCancel = document.getElementById("cancel");

const cookiesElement = document.getElementById("cookies");
const btnAccept = document.getElementById("accept");

const cookies = localStorage.getItem("cookies") || false;

// Función para obtener un dispositivo
const loadDevice = (mac) => {
    const list = JSON.parse(localStorage.getItem("list")) || [];
    const deviceIndex = list.find((device) => device.mac === mac);

    if (!deviceIndex) return;

    originalMAC = mac; // Guardar la MAC original
    inputName.value = deviceIndex.name;
    inputMAC.value = deviceIndex.mac;
    inputHost.value = deviceIndex.host;
    inputPort.value = deviceIndex.port;
    inputPortStatus.value = deviceIndex.portStatus;
    inputTimeout.value = deviceIndex.timeout;

    modalDevice.classList.remove("hidden");
};

// Función para agregar un dispositivo
const addDevice = () => {
    const list = JSON.parse(localStorage.getItem("list")) || [];

    const nameDevice = inputName.value;
    const macDevice = inputMAC.value;
    const hostDevice = inputHost.value;
    const portDevice = inputPort.value;
    const portStatusDevice = inputPortStatus.value;
    const timeoutDevice = inputTimeout.value;

    const macExists = list.some((device) => device.mac === macDevice);
    if (macExists && !editMode) {
        spawnAlert("Observación", "La dirección MAC ya existe. Por favor, ingresa una dirección MAC diferente.", "exclamation-triangle");
        return;
    }

    const newDevice = {
        name: nameDevice,
        mac: macDevice,
        host: hostDevice,
        port: portDevice,
        portStatus: portStatusDevice,
        timeout: timeoutDevice,
    };

    list.push(newDevice);
    localStorage.setItem("list", JSON.stringify(list));

    spawnAlert("Éxito", "Dispositivo agregado correctamente.", "check-circle");

    formDevice.reset();
    modalDevice.classList.add("hidden");
};

// Función para actualizar un dispositivo
const updateDevice = () => {
    const list = JSON.parse(localStorage.getItem("list")) || [];
    const deviceIndex = list.findIndex((device) => device.mac === originalMAC);

    if (deviceIndex === -1) return;

    const nameDevice = inputName.value;
    const macDevice = inputMAC.value;
    const hostDevice = inputHost.value;
    const portDevice = inputPort.value;
    const portStatusDevice = inputPortStatus.value;
    const timeoutDevice = inputTimeout.value;

    const newDevice = {
        name: nameDevice,
        mac: macDevice,
        host: hostDevice,
        port: portDevice,
        portStatus: portStatusDevice,
        timeout: timeoutDevice,
    };

    list[deviceIndex] = newDevice;
    localStorage.setItem("list", JSON.stringify(list));

    spawnAlert("Éxito", "Dispositivo actualizado correctamente.", "check-circle");

    formDevice.reset();
    editMode = false;
    originalMAC = null;
    modalDevice.classList.add("hidden");
};

// Función para eliminar un dispositivo
const deleteDevice = (mac) => {
    const list = JSON.parse(localStorage.getItem("list")) || [];
    const deviceIndex = list.findIndex((device) => device.mac === mac);

    if (deviceIndex === -1) return;

    list.splice(deviceIndex, 1);
    localStorage.setItem("list", JSON.stringify(list));

    spawnAlert("Éxito", "Dispositivo eliminado correctamente.", "check-circle");

    showDevices();
};

// Mostrar el aviso de cookies
cookies ? cookiesElement.classList.add("hidden") : cookiesElement.classList.remove("hidden");

// Ajustar el tamaño del contenedor
main.style.minHeight = `${window.innerHeight}px`;

// Mostrar los dispositivos al cargar la página
showDevices();

// Agregar evento de redimensionamiento de la ventana
window.addEventListener("resize", () => {
    main.style.minHeight = `${window.innerHeight}px`;
});

// Agregar evento de clic en el botón de escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalDevice.classList.contains("hidden")) {
        e.preventDefault();
        btnCancel.click();
    }
});

// Agregar evento de clic en el botón de agregar
btnAdd.addEventListener("click", () => {
    modalDevice.classList.remove("hidden");
});

// Agregar evento de envío del formulario
formDevice.addEventListener("submit", (e) => {
    e.preventDefault();

    // Función para validar la longitud de los campos
    const validateLength = (value, min) => {
        if (value.length < min) return false;

        window.scrollTo({ top: 0, behavior: "smooth" });
        return true;
    };

    if (!validateLength(inputName.value, 3)) {
        spawnAlert("Observación", "El nombre no es valido. Debe tener al menos 3 caracteres.", "exclamation-triangle", 4000);
        return;
    }
    if (!validateLength(inputHost.value, 7)) {
        spawnAlert("Observación", "La dirección IP no es válida. Debe tener al menos 7 caracteres.", "exclamation-triangle", 4000);
        return;
    }
    if (!validateLength(inputMAC.value, 17)) {
        spawnAlert("Observación", "La dirección MAC no es válida. Debe tener al menos 17 caracteres.", "exclamation-triangle", 4000);
        return;
    }

    try {
        if (editMode) updateDevice();
        else addDevice();

        // Mostrar los dispositivos
        showDevices();
    } catch (error) {
        console.error("Error al modificar el dispositivo:", error.message);
        spawnAlert("Error", "Ocurrió un error al modificar el dispositivo. Por favor, verifica los datos ingresados o las cookies.", "x-circle");
        return;
    }
});

// Agregar evento de validación del host
inputHost.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\s+/g, "");
});

// Agregar evento de validación de la dirección MAC
inputMAC.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    value = value.slice(0, 12);
    const formattedValue = value.match(/.{1,2}/g)?.join(":") || "";
    e.target.value = formattedValue;
});

// Agregar evento de validación de los puertos
inputPort.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    value = value.slice(0, 5);
    e.target.value = value;
});
inputPortStatus.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    value = value.slice(0, 5);
    e.target.value = value;
});

// Agregar evento de validación del tiempo de espera
inputTimeout.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    value = value.slice(0, 4);
    e.target.value = value;
});

// Agregar evento de clic en el botón de cancelar
btnCancel.addEventListener("click", () => {
    modalDevice.classList.add("dispose");
    setTimeout(() => {
        modalDevice.classList.add("hidden");
        modalDevice.classList.remove("dispose");
    }, 300);
    editMode = false;
    originalMAC = null;
});

// Agregar evento de clic en el botón de aceptar
btnAccept.addEventListener("click", () => {
    cookiesElement.classList.add("dispose");
    setTimeout(() => {
        cookiesElement.classList.add("hidden");
        cookiesElement.classList.remove("dispose");
    }, 1000);
    localStorage.setItem("cookies", true);
});

// Función para mostrar los dispositivos
function showDevices() {
    const list = JSON.parse(localStorage.getItem("list")) || [];

    if (list.length === 0) {
        container.innerHTML = '<h1 class="empty">Presiona el botón <small>+</small> para agregar un dispositivo</h1>';
        return;
    }

    container.innerHTML = "";

    // Recorrer la lista de dispositivos
    list.forEach((device) => {
        let options = null;
        const card = document.createElement("div");

        // Función para comprobar el estado del dispositivo
        const checkStatus = async () => {
            const data = {
                HOST: device.host,
                PORT: device.portStatus,
            };

            const powerResponse = await getStatus(data);

            if (powerResponse.status === 200) {
                card.classList.remove("power");
                card.classList.add("power-on");
            } else {
                card.classList.remove("power");
                card.classList.remove("power-on");
            }
        };

        // Crear la tarjeta del dispositivo
        card.classList.add("card");
        card.classList.add("power");
        card.innerHTML = `
            <i class="bi bi-router"></i>
            <h3>${device.name}</h3>
            <p>${device.mac}</p>
            <button type="button"><i class="bi bi-three-dots" title="Opciones"></i></button>
            <span><i class="bi bi-power"></i></span>
        `;

        // Agregar evento de fin de animación
        card.addEventListener("animationend", (a) => {
            if (a.animationName === "clicked") card.classList.remove("clicked");
        });

        // Agregar evento de clic en la tarjeta
        card.addEventListener("click", async () => {
            options = card.querySelector(".options") || null;

            if (!options) card.classList.add("clicked");
            if (!card.classList.contains("power-on") && !card.classList.contains("power")) {
                card.classList.add("power");

                let data = {
                    MAC: device.mac,
                    HOST: device.host,
                    PORT: device.port,
                };

                const response = await sendWOL(data);

                if (response.status === 200) {
                    const dataResponse = await response.json();

                    spawnAlert("Éxito", dataResponse.message, "check-circle");
                } else {
                    const dataResponse = await response.json();

                    spawnAlert("Error", dataResponse.message, "x-circle");
                    card.classList.remove("power");
                }

                setTimeout(async () => {
                    data = {
                        HOST: device.host,
                        PORT: device.portStatus,
                    };

                    const powerResponse = await getStatus(data);

                    if (powerResponse.status === 200) {
                        const dataResponse = await powerResponse.json();

                        spawnAlert("Estado", dataResponse.message, "check-circle");
                        card.classList.add("power-on");
                        card.classList.remove("power");
                    } else {
                        const dataResponse = await powerResponse.json();

                        spawnAlert("Error", dataResponse.message, "x-circle");
                        card.classList.remove("power");
                    }
                }, parseInt(device.timeout) * 1000);
            } else if (card.classList.contains("power")) spawnAlert("Observación", "Comprobando estado del dispositivo...", "exclamation-triangle");
        });

        // Agregar evento de mouseover y mouseleave
        card.addEventListener("mouseleave", () => {
            options = card.querySelector(".options") || null;

            if (options) options.remove();

            card.style.zIndex = 1;
        });

        // Agregar evento de clic en el botón de opciones
        card.querySelector("button").addEventListener("click", (e) => {
            e.stopPropagation();

            // Crear el flotante de opciones
            const optionsElement = `
                <div class="options">
                    <div class="option" data-action="close">
                        <i class="bi bi-x-lg"></i>
                        <small>Cerrar</small>
                    </div>
                    <div class="option" data-action="edit">
                        <i class="bi bi-pencil-square"></i>
                        <small>Editar</small>
                    </div>
                    <div class="option" data-action="delete">
                        <i class="bi bi-trash"></i>
                        <small>Eliminar</small>
                    </div>
                </div>
                `;

            // Insertar el flotante de opciones en la tarjeta
            card.insertAdjacentHTML("beforeend", optionsElement);
            card.style.zIndex = 2;

            // Recorrer las opciones
            card.querySelectorAll(".option").forEach((option) => {
                // Agregar evento de clic en cada opción
                option.addEventListener("click", (o) => {
                    o.stopPropagation();

                    const action = option.getAttribute("data-action");

                    options = card.querySelector(".options") || null;

                    switch (action) {
                        case "edit":
                            editMode = true;
                            loadDevice(device.mac);
                            break;
                        case "delete":
                            deleteDevice(device.mac);
                            break;
                        default:
                            options.remove();

                            card.style.zIndex = 1;
                            break;
                    }
                });
            });
        });

        // Insertar la tarjeta en el contenedor
        container.appendChild(card);

        // Comprobar el estado del dispositivo
        setInterval(() => {
            if (card.classList.contains("power-on")) checkStatus();
        }, 5000);

        checkStatus();
    });
}
