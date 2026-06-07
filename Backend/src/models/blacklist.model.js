const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is req to be added in blacklist"]
    }
}, {
    timestamps: true
})

const tokenBlacklistModel = mongoose.model('Blacklist', blacklistTokenSchema)

module.exports = tokenBlacklistModel;