const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messagesSchema = new Schema({
    forum: String,
    date: Date,
    message: String,
    poster: String
});

mongoose.model('messages', messagesSchema);