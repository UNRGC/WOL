const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const hostnameRegex = /^(?=.{1,253}$)(localhost|([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*)$/;

const isValidPort = (value) => {
    const port = Number(value);

    return Number.isInteger(port) && port >= 1 && port <= 65535;
};

const isValidHost = (value) => {
    if (typeof value !== "string") return false;

    const normalized = value.trim();

    return normalized.length > 0 && (ipv4Regex.test(normalized) || hostnameRegex.test(normalized));
};

const hostAllowList = (process.env.HOST_ALLOWLIST || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

const isAllowedHost = (value) => {
    if (hostAllowList.length === 0) return true;

    return hostAllowList.includes(value.trim().toLowerCase());
};

export const checkInput = (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ message: "El cuerpo de la solicitud es inválido." });
        return;
    }

    const { MAC, HOST, PORT } = req.body;
    const allowedFields = req.method === "PUT" ? ["MAC", "HOST", "PORT"] : ["HOST", "PORT"];
    const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        res.status(400).json({ message: `Campos inválidos: ${invalidFields.join(", ")}` });
        return;
    }

    if (!isValidHost(HOST)) {
        res.status(400).json({ message: "Dirección IP o nombre de host inválido." });
        return;
    }

    if (!isAllowedHost(HOST)) {
        res.status(403).json({ message: "El host indicado no está permitido." });
        return;
    }

    if (!isValidPort(PORT)) {
        res.status(400).json({ message: "Puerto inválido." });
        return;
    }

    if (req.method === "PUT") {
        if (typeof MAC !== "string" || !macRegex.test(MAC.trim())) {
            res.status(400).json({ message: "Dirección MAC inválida." });
            return;
        }
    }

    next();
};
