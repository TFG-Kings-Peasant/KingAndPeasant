export const validateCreateLobby = (req, res, next) => {
    const { name, privacy, player1Id } = req.body;
    const errors = [];

    // Validar Nombre del Lobby
    if (!name || typeof name !== 'string') {
        errors.push({ code: 'INVALID_FIELD', message: 'El nombre del lobby es obligatorio' });
    } else {
        const trimmedName = name.trim();
        if (trimmedName.length < 3) {
            errors.push({ code: 'INVALID_FIELD', message: 'El nombre del lobby debe tener al menos 3 caracteres' });
        }
        if (trimmedName.length > 20) {
            errors.push({ code: 'INVALID_FIELD', message: 'El nombre del lobby no puede superar los 20 caracteres' });
        }
    }

    // Validar Privacidad (asumiendo que solo puede ser PUBLIC o PRIVATE)
    if (!privacy || !['PUBLIC', 'PRIVATE'].includes(privacy)) {
        errors.push({ code: 'INVALID_FIELD', message: 'La privacidad debe ser PUBLIC o PRIVATE' });
    }

    // Validar Creador (player1Id)
    if (!player1Id || isNaN(Number(player1Id))) {
        errors.push({ code: 'INVALID_FIELD', message: 'El ID del jugador 1 es obligatorio y debe ser un número' });
    }

    // Si hay errores, cortamos la petición aquí y devolvemos 400
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation error', errors });
    }

    // Normalizar datos antes de pasarlos al controlador
    req.body.name = name.trim();
    
    next();
};

export const validateJoinLobby = (req, res, next) => {
    const { id } = req.params;
    const { player2Id } = req.body;
    const errors = [];

    // Validar ID del Lobby en los parámetros de la URL
    if (!id || isNaN(Number(id))) {
        errors.push({ code: 'INVALID_FIELD', message: 'El ID del lobby proporcionado en la URL no es válido' });
    }

    // Validar ID del jugador que se une
    if (!player2Id || isNaN(Number(player2Id))) {
        errors.push({ code: 'INVALID_FIELD', message: 'El ID del jugador 2 es obligatorio y debe ser un número' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation error', errors });
    }

    next();
};

export const validateSetReady = (req, res, next) => {
    const { id } = req.params;
    const { playerId, isReady } = req.body;
    const errors = [];

    if (!id || isNaN(Number(id))) {
        errors.push({ code: 'INVALID_FIELD', message: 'El ID del lobby proporcionado no es válido' });
    }

    if (!playerId || isNaN(Number(playerId))) {
        errors.push({ code: 'INVALID_FIELD', message: 'El ID del jugador es obligatorio' });
    }

    if (typeof isReady !== 'boolean') {
        errors.push({ code: 'INVALID_FIELD', message: 'El estado isReady debe ser un valor booleano (true o false)' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation error', errors });
    }

    next();
};