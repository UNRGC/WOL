const parseEnvInt = (value, fallback) => {
    const parsed = Number.parseInt(value ?? "", 10);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const rateLimitWindowMs = parseEnvInt(process.env.RATE_LIMIT_WINDOW_MS, 60000);
const rateLimitMaxRequests = parseEnvInt(process.env.RATE_LIMIT_MAX_REQUESTS, 60);
const requestTimeoutMs = parseEnvInt(process.env.REQUEST_TIMEOUT_MS, 12000);

const rateCounters = new Map();

// Limpia entradas vencidas para evitar crecimiento infinito del mapa en procesos largos.
const cleanupRateCounters = (now) => {
    for (const [ip, entry] of rateCounters.entries()) {
        if (now - entry.startedAt >= rateLimitWindowMs) {
            rateCounters.delete(ip);
        }
    }
};

export const rateLimitByIp = (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    cleanupRateCounters(now);

    const current = rateCounters.get(ip);

    if (!current || now - current.startedAt >= rateLimitWindowMs) {
        rateCounters.set(ip, { count: 1, startedAt: now });
        next();
        return;
    }

    if (current.count >= rateLimitMaxRequests) {
        res.status(429).json({ message: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." });
        return;
    }

    current.count += 1;
    next();
};

export const requestTimeoutGuard = (req, res, next) => {
    res.setTimeout(requestTimeoutMs, () => {
        if (!res.headersSent) {
            res.status(408).json({ message: "La solicitud excedió el tiempo límite." });
        }
    });

    next();
};

