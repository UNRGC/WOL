import wol from "wake_on_lan";
import net from "net";

const parseEnvInt = (value, fallback) => {
    const parsed = Number.parseInt(value ?? "", 10);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const statusSocketTimeoutMs = parseEnvInt(process.env.STATUS_SOCKET_TIMEOUT_MS, 5000);

export const checkStatus = (HOST, PORT) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        const onSuccess = () => {
            socket.destroy();
            resolve(true);
        };

        const onError = () => {
            socket.destroy();
            resolve(false);
        };

        socket.setTimeout(statusSocketTimeoutMs);
        socket.once("connect", onSuccess);
        socket.once("error", onError);
        socket.once("timeout", onError);

        socket.connect(Number(PORT), HOST);
    });
};

export const sendWOL = (MAC, HOST, PORT) => {
    return new Promise((resolve, reject) => {
        wol.wake(MAC, { address: HOST, port: PORT }, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};
