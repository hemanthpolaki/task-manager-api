const mongoose = require('mongoose');
mongoose.pluralize(null);
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./Task');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

// Mongoose Virtual to add relationship between User and Task.
// This is setting from User end. We need to define owner field in Task model.
userSchema.virtual('UserTask', {
    ref: 'tasks',
    localField: '_id',
    foreignField: 'owner'
})

// Method to delete/Hide sensitive info while sending back response.
// userSchema.methods.hidePrivateInfo = function () {
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// Method to generate Auth token while logging in and creating user.
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = await jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);
    user.tokens.push({token});
    await user.save();
    return token;
}

// For login purpose // Static function - works on model level ie., works for entire model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if (!user) {
        throw new Error('Unable to login');
    }
    const isPwdMatching = await bcryptjs.compare(password, user.password);
    if (!isPwdMatching) {
        throw new Error('Unable to login');
    }
    return user;
}

// For pre middleware (Instead of next())
function doStuff () { }

// Creating a 'pre' Mongoose Middleware. Mind that Mongoose and Mongodb middlewares are different.
// Delete all tasks when user is removed.
userSchema.pre('remove', async function () {
    const user = this;
    await Task.deleteMany({owner: user._id});
    await doStuff();
})

// Creating a 'pre' Mongoose Middleware. Mind that Mongoose and Mongodb middlewares are different.
// Hash a password before saving.
userSchema.pre('save', async function () {

    const user = this;
    if (user.isModified('password')) {
        user.password = await bcryptjs.hash(user.password, 8);
    }
    await doStuff(user);
})

// Creating an User model
const User = mongoose.model('users', userSchema);

module.exports = User;