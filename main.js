import express from "express";
import cors from "cors";
import wolRoutes from "./src/routes/wolRoutes.js";
import os from "os";
import { config } from "dotenv";

// Cargar variables de entorno
config();

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Obtener la dirección IP de la máquina
const getIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
};

// Crear la aplicación Express
const app = express();

// Configurar Express para que pueda parsear JSON
app.use(express.json());

// Configurar CORS
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || origin.startsWith("http://localhost:3000")) {
                callback(null, true);
            } else {
                callback(new Error("No permitido por CORS"));
            }
        },
    })
);

// Middleware para manejar errores de JSON mal formados
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        console.error("Error de JSON mal formado:", err.message);
        res.status(400).json({ message: "JSON mal formado" });
        return;
    }
    next();
});

// Rutas
app.use("/wol", wolRoutes);

// Archivos estáticos
app.use(express.static("public"), express.static("private/video/hls"));

// Iniciar el servidor
let server = null;
server = app.listen(PORT, () => {
    const ipAddress = getIPAddress();
    console.debug(`Servidor iniciado en http://${ipAddress}:${PORT}`);
});

// Manejar eventos antes de que la API termine
const shutdown = () => {
    console.debug("Cerrando el servidor...");

    // Cerrar conexiones abiertas y liberar recursos
    server.close(() => {
        console.debug("Servidor cerrado correctamente");
        process.exit(0);
    });

    // Si hay procesos asíncronos, dar tiempo para terminarlos
    setTimeout(() => {
        console.warn("Forzando cierre...");
        process.exit(1);
    }, 5000);
};

// Capturar señales del sistema
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
