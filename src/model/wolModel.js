import wol from "wake_on_lan";
import net from "net";

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

        socket.setTimeout(10000);
        socket.once("connect", onSuccess);
        socket.once("error", onError);
        socket.once("timeout", onError);

        socket.connect(PORT, HOST);
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
