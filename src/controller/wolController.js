import { checkStatus, sendWOL } from "../model/wolModel.js";

export const checkStatusHandler = async (req, res) => {
    const { HOST, PORT } = req.body;

    try {
        const resolve = await checkStatus(HOST, PORT);

        if (resolve) {
            console.debug("El dispositivo está encendido", HOST);
            res.status(200).json({ message: "El dispositivo está encendido." });
        } else {
            console.debug("El dispositivo está apagado", HOST);
            res.status(202).json({ message: "El puerto de estado no responde. Verifica la configuración." });
        }
    } catch (error) {
        console.error("Error al verificar el estado:", error.message);
        res.status(500).json({ message: "No se pudo verificar el estado. Error interno del servidor." });
    }
};

export const sendWOLHandler = async (req, res) => {
    const { MAC, HOST, PORT } = req.body;

    try {
        await sendWOL(MAC, HOST, PORT);
        console.debug("Señal enviada con éxito", HOST);
        res.status(200).json({ message: "Señal enviada con éxito." });
    } catch (error) {
        console.error("Error al enviar la señal:", error.message);
        res.status(500).json({ message: "Error al enviar la señal. Error interno del servidor." });
    }
};
