const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try{
        const token = req.header('Authorization').split(' ')[1];
        const payload = await jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({_id: payload._id, 'tokens.token': token});
        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send('Sorry! Please authenticate');
    }
}

module.exports = auth