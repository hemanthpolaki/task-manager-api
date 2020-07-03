const express = require('express');
const User = require('../models/User');
const router = express.Router();
const auth = require('../middleware/auth')
const multer = require('multer');
const sharp = require('sharp');
const {sendWelcomeEmail, sendCanellationEmail} = require('../emails/account')

router.post('/users', async (req, res) => {
    try{
        const user = new User(req.body);
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
        // res.status(201).send({user: user.hidePrivateInfo(), token});
    } catch (e) {
        res.status(400).send('' + e.message);
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        res.status(400).send('' + e.message);
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter( (token) => {
            return token.token !== req.token;
        })
        await req.user.save()
        res.send();
    } catch (e) {
        res.status(500).send('' + e.message);
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send('' + e.message);
    }

})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;
    try{
        const user = await User.findById(_id);
        if (!user) {
            return res.send(404).send();
        }
        res.send(user);
    } catch (e) {
        res.status(500).send('' + e.message);
    }
})

router.patch('/users/me', auth, async (req, res) => {
    
    // If any non present parameter (like height, blood group which we're not storing in our db) is sent to update, mongoose usually Ignores it and send 200 status code. To avoid this and specify as a not valid Op, we're writing a check.
    const requestedUpdateOperations = Object.keys(req.body);
    const validUpdateOperations = ['name', 'email', 'age', 'password'];
    const areAllReqOpsValid = requestedUpdateOperations.every((update) => validUpdateOperations.includes(update));
    if (!areAllReqOpsValid) {
        return res.status(400).send('Invalid updates!');
    }

    try{
        requestedUpdateOperations.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.status(201).send(req.user);
    } catch (e) {
        res.status(400).send('' + e.message);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        req.user.remove();
        sendCanellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send('' + e.message);
    }
})

// https://www.npmjs.com/package/multer
const uploadFile = multer({
    limits: 1000000, // 1MB,
    fileFilter (req, file, cb) {
        // if (!file.originalname.endsWith('.pdf')) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image'));
        }
        cb(null, true);
        // cb(null, false) // To reject this file pass `false`, like so:
        // cb(null, true) // To accept the file pass `true`, like so:
        // cb(new Error('I don\'t have a clue!'))   // You can always pass an error if something goes wrong:

        // After uploading file, it is stored in req.file header and any text will be stored in req.body section.
    }
})

router.post('/users/me/avatar', auth, uploadFile.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    // req.user.avatar = req.file.buffer;   // Without sharp library
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
})


router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send('' + e.message);
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error('User or avatar not found');
        }
        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch (e) {
        res.status(400).send('' + e.message);
    }

})

module.exports = router