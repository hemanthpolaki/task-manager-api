const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/tasks', auth, async (req, res) => {
    try{
        // const task = new Task(req.body);
        const task = new Task({
            ...req.body,
            owner: req.user._id
        })
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send('' + e.message);
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=x&skip=y
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }
    if (req.query.sort) {
        const param = req.query.sort.split(':');
        sort[param[0]] = param[1] === 'desc' ? -1 : 1;
    }
    try{
        const user = await req.user.populate({
            path: 'UserTask',
            match,
            options: {
                limit: parseInt(req.query.limit),       // Mongoose will ignore if incase of any error while parsing.
                skip: parseInt(req.query.skip),
                sort
                // sort expects an object.
                // sort : { sortByField: -1 or 1 }      --> -1 for descending, 1 for ascending
            }
        }).execPopulate();
        const tasks = user.UserTask;                    // UserTask in above & current line should match
        // const tasks = Task.findById({owner: req.user._id});
        if (!tasks) {
            return res.status(404).send();
        }
        res.send(tasks);
    } catch (e) {
        res.status(400).send('' + e.message);
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500).send('' + e.message);
    }
})


router.patch('/tasks/:id', auth, async (req, res) => {

    // If any non present parameter (like height, blood group which we're not storing in our db) is sent to update, mongoose usually Ignores it and send 200 status code. To avoid this and specify as a not valid Op, we're writing a check.
    const requestedUpdateOperations = Object.keys(req.body);
    const validUpdateOperations = ['description', 'completed'];
    const areAllReqOpsValid = requestedUpdateOperations.every((update) => validUpdateOperations.includes(update));
    if(!areAllReqOpsValid) return res.status(404).send('Check your updates');

    try{
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id});
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        if (!task) {
            return res.status(404).send('Check your ID');
        }
        requestedUpdateOperations.forEach((update) => task[update] = req.body[update]);
        task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send('' + e.message);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = await Task.findByIdAndDelete({_id, owner: req.user._id});
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500)('' + e.message);
    }
})

module.exports = router