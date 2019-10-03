const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messagesSchema = new Schema({
    date: Date,
    message: String,
    poster: String
});

const forumSchema = new Schema({
    date: Date,
    title: String,
    views: Number,
    messages: [messagesSchema],
});

mongoose.model('forums', forumSchema);