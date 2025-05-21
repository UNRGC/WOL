export const checkInput = (req, res, next) => {
    const { MAC, HOST, PORT, ...rest } = req.body;

    if (MAC) {
        // Validar la dirección MAC
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!macRegex.test(MAC)) {
            res.status(400).json({ message: "Dirección MAC inválida." });
            return;
        }
    }

    // Validar la dirección IP o el nombre de host
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const hostRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
    if (!ipRegex.test(HOST) && !hostRegex.test(HOST)) {
        res.status(400).json({ message: "Dirección IP o nombre de host inválido." });
        return;
    }

    // Validar el puerto
    if (PORT && (isNaN(PORT) || PORT < 1 || PORT > 65535)) {
        res.status(400).json({ message: "Puerto inválido." });
        return;
    }

    // Validar que no haya otros campos en el cuerpo de la solicitud
    const validFields = ["MAC", "IP", "PORT"];
    const invalidFields = Object.keys(rest).filter((field) => !validFields.includes(field));
    if (invalidFields.length > 0) {
        res.status(400).json({ message: `Campos inválidos: ${invalidFields.join(", ")}` });
        return;
    }

    next();
};
