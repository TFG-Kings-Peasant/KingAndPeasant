import jwt from 'jsonwebtoken';


function authenticateToken(req, res, next) {
    const Barertoken = req.headers['authorization'];
    if (Barertoken == undefined) return res.sendStatus(401);
    const token = Barertoken && Barertoken.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    const match = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user=user;
        next();
    });
};

export { authenticateToken };
    

