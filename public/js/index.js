import spawnAlert from "./alert.js";
import { getStatus, sendWOL } from "./request.js";

// Variables
let editMode = false;
let originalMAC = null; // Para guardar la MAC original al editar
const statusIntervals = new Map();
const STATUS_REFRESH_MS = 5000;

const clearStatusInterval = (mac) => {
    const intervalId = statusIntervals.get(mac);

    if (intervalId !== undefined) {
        clearInterval(intervalId);
    }

    statusIntervals.delete(mac);
};

const clearAllStatusIntervals = () => {
    statusIntervals.forEach((intervalId) => clearInterval(intervalId));
    statusIntervals.clear();
};

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

    list.push({
        name: nameDevice,
        mac: macDevice,
        host: hostDevice,
        port: portDevice,
        portStatus: portStatusDevice,
        timeout: timeoutDevice,
    });
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

    const macExists = list.some((device, index) => device.mac === macDevice && index !== deviceIndex);
    if (macExists) {
        spawnAlert("Observación", "La dirección MAC ya existe. Por favor, ingresa una dirección MAC diferente.", "exclamation-triangle");
        return;
    }

    list[deviceIndex] = {
        name: nameDevice,
        mac: macDevice,
        host: hostDevice,
        port: portDevice,
        portStatus: portStatusDevice,
        timeout: timeoutDevice,
    };
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

    clearStatusInterval(mac);
    list.splice(deviceIndex, 1);
    localStorage.setItem("list", JSON.stringify(list));

    spawnAlert("Éxito", "Dispositivo eliminado correctamente.", "check-circle");

    showDevices();
};

const buildEmptyState = () => {
    const empty = document.createElement("h1");
    empty.classList.add("empty");
    empty.append("Presiona el botón ");

    const small = document.createElement("small");
    small.textContent = "+";

    empty.appendChild(small);
    empty.append(" para agregar un dispositivo");

    return empty;
};

const buildOptionsMenu = (card, device) => {
    const options = document.createElement("div");
    options.classList.add("options");

    const createOption = (action, iconClass, label) => {
        const option = document.createElement("div");
        option.classList.add("option");
        option.dataset.action = action;

        const icon = document.createElement("i");
        icon.className = iconClass;

        const small = document.createElement("small");
        small.textContent = label;

        option.append(icon, small);

        option.addEventListener("click", (event) => {
            event.stopPropagation();

            options.remove();
            card.style.zIndex = 1;

            switch (action) {
                case "edit":
                    editMode = true;
                    loadDevice(device.mac);
                    break;
                case "delete":
                    deleteDevice(device.mac);
                    break;
                default:
                    break;
            }
        });

        return option;
    };

    options.append(
        createOption("close", "bi bi-x-lg", "Cerrar"),
        createOption("edit", "bi bi-pencil-square", "Editar"),
        createOption("delete", "bi bi-trash", "Eliminar")
    );

    return options;
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
    e.target.value = value.match(/.{1,2}/g)?.join(":") || "";
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
    clearAllStatusIntervals();

    const list = JSON.parse(localStorage.getItem("list")) || [];

    container.replaceChildren();

    if (list.length === 0) {
        container.appendChild(buildEmptyState());
        return;
    }

    // Recorrer la lista de dispositivos
    list.forEach((device) => {
        const card = document.createElement("div");
        const icon = document.createElement("i");
        const title = document.createElement("h3");
        const description = document.createElement("p");
        const optionsButton = document.createElement("button");
        const optionsIcon = document.createElement("i");
        const power = document.createElement("span");
        const powerIcon = document.createElement("i");

        icon.className = "bi bi-router";
        title.textContent = device.name;
        description.textContent = device.mac;

        optionsButton.type = "button";
        optionsIcon.className = "bi bi-three-dots";
        optionsIcon.title = "Opciones";
        optionsButton.appendChild(optionsIcon);

        powerIcon.className = "bi bi-power";
        power.appendChild(powerIcon);

        // Función para comprobar el estado del dispositivo
        const checkStatus = async () => {
            const data = {
                HOST: device.host,
                PORT: device.portStatus,
            };

            try {
                const powerResponse = await getStatus(data);

                if (powerResponse.status === 200) {
                    card.classList.remove("power");
                    card.classList.add("power-on");
                } else {
                    card.classList.remove("power");
                    card.classList.remove("power-on");
                }
            } catch (error) {
                console.error("Error al comprobar el estado del dispositivo:", error.message);
                card.classList.remove("power");
                card.classList.remove("power-on");
            }
        };

        // Crear la tarjeta del dispositivo
        card.classList.add("card");
        card.classList.add("power");
        card.style.zIndex = 1;
        card.append(icon, title, description, optionsButton, power);

        // Agregar evento de fin de animación
        card.addEventListener("animationend", (a) => {
            if (a.animationName === "clicked") card.classList.remove("clicked");
        });

        // Agregar evento de clic en la tarjeta
        card.addEventListener("click", async () => {
            const options = card.querySelector(".options");

            if (options) options.remove();
            else card.classList.add("clicked");

            if (!card.classList.contains("power-on") && !card.classList.contains("power")) {
                card.classList.add("power");

                const data = {
                    MAC: device.mac,
                    HOST: device.host,
                    PORT: device.port,
                };

                let response;

                try {
                    response = await sendWOL(data);
                } catch (error) {
                    console.error("Error al enviar la señal WOL:", error.message);
                    spawnAlert("Error", "No se pudo enviar la señal WOL.", "x-circle");
                    card.classList.remove("power");
                    return;
                }

                const dataResponse = await response.json().catch(() => ({ message: "Respuesta inválida del servidor." }));

                if (response.status === 200) {
                    spawnAlert("Éxito", dataResponse.message, "check-circle");
                } else {
                    spawnAlert("Error", dataResponse.message, "x-circle");
                    card.classList.remove("power");
                }

                setTimeout(async () => {
                    const statusData = {
                        HOST: device.host,
                        PORT: device.portStatus,
                    };

                    const powerResponse = await getStatus(statusData);
                    const dataResponse = await powerResponse.json().catch(() => ({ message: "Respuesta inválida del servidor." }));

                    if (powerResponse.status === 200) {
                        spawnAlert("Estado", dataResponse.message, "check-circle");
                        card.classList.add("power-on");
                        card.classList.remove("power");
                    } else {
                        spawnAlert("Error", dataResponse.message, "x-circle");
                        card.classList.remove("power");
                    }
                }, Number.parseInt(device.timeout, 10) * 1000);
            } else if (card.classList.contains("power")) spawnAlert("Observación", "Comprobando estado del dispositivo...", "exclamation-triangle");
        });

        // Agregar evento de mouseover y mouseleave
        card.addEventListener("mouseleave", () => {
            const options = card.querySelector(".options");

            if (options) options.remove();

            card.style.zIndex = 1;
        });

        // Agregar evento de clic en el botón de opciones
        optionsButton.addEventListener("click", (e) => {
            e.stopPropagation();

            const existingOptions = card.querySelector(".options");

            if (existingOptions) {
                existingOptions.remove();
                card.style.zIndex = 1;
                return;
            }

            const optionsElement = buildOptionsMenu(card, device);

            card.appendChild(optionsElement);
            card.style.zIndex = 2;
        });

        // Insertar la tarjeta en el contenedor
        container.appendChild(card);

        // Comprobar el estado del dispositivo
        clearStatusInterval(device.mac);
        const intervalId = setInterval(() => {
            if (card.isConnected && card.classList.contains("power-on")) checkStatus();
        }, STATUS_REFRESH_MS);

        statusIntervals.set(device.mac, intervalId);

        checkStatus();
    });
}
