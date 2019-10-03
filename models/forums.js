const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messagesSchema = new Schema({
    // _id: Schema.ObjectID,
    date: Date,
    message: String,
    poster: String
});

const forumSchema = new Schema({
    // _id: Schema.ObjectID,
    date: Date,
    title: String,
    views: Number,
    messages: [messagesSchema],
});

module.exports = mongoose.model('forums', forumSchema);