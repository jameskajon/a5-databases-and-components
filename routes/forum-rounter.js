const express = require('express');
const forumRouter = express.Router();
const firebaseAdmin = require("firebase-admin");
const mongoose = require('mongoose');
const Forum = require('../models/forums.js');

const auth = firebaseAdmin.auth();

function formateTimestamp(ts) {
    return ts.toLocaleString();
}

async function getForum(forumId) {
    return await mongoose.model('forums').findOne({_id:forumId})
        .then((forum) => {
            forum.views = forum.views + 1;
            forum.save();
            return forum;
        })
        .then(async (forumData) => {
            const messagePromises = [];
            forumData.messages.forEach(msg => {
                // messages.push({message: msg.message, )
                messagePromises.push(new Promise(async function(resolve, reject) {
                    return resolve({
                        messageId: msg._id,
                        message: msg.message,
                        date: formateTimestamp(msg.date),
                        ... await getUserDataUid(msg.poster),
                    });
                }));
            });
            return {forumId: forumData._id,
                forumTitle: forumData.title,
                messages: await Promise.all(messagePromises)
            };
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
}

async function getForums() {
    const messagesPromises = [];
    const forumsPromise = mongoose.model('forums').find()
        .then(async (forums, error) => {
            const parsedForums = [];
            await forums.forEach(forum => {
                messagesPromises.push(new Promise(async function(resolve, reject) {
                    return resolve({
                        created: {... await getUserDataUid(forum.messages[0].poster),
                            date: formateTimestamp(forum.messages[0].date)},  // poster is the firebase uid of the poster
                        lastPost: {... await getUserDataUid(forum.messages[forum.messages.length - 1].poster),
                            date: formateTimestamp(forum.messages[forum.messages.length - 1].date)},  // poster is the firebase uid of the poster
                    });
                }));
                parsedForums.push({
                    forumId: forum._id,
                    shortDesc: forum.messages[0].message,
                    date: formateTimestamp(forum.messages[0].date),
                    title: forum.title,
                    stats: {
                        views: forum.views,
                        replies: forum.messages.length - 1,
                    },
                });
            });
            return parsedForums;
        });
    const forums = await forumsPromise;
    const msgsData = await Promise.all(messagesPromises);
    forums.forEach((forum, idx) => {
        forum.messageData = msgsData[idx];
    });
    return forums;
}

// returns promise
async function getUserDataUid(uid) {
    return await auth.getUser(uid)
        .then(function(userRecord) {
            return {
                uid: uid,
                name: userRecord.displayName,
                email: userRecord.email,
                memberSince: userRecord.metadata.creationTime,  // creation time is already a string in GMT
            }
        })
        .catch(function(error) {
            console.log('Error fetching user data:', error);
            return {
                uid: uid,
                name: '[deleted]',
                email: '[deleted]',
                memberSince: '[deleted]',
            };
        });
}

// forum list view
forumRouter.get('/', async function(req, res, next) {
    let forumData = await getForums();
    res.render('index', {title: "The Forums", forumData: forumData})
});

// forum messages view
forumRouter.get('/forum/:forumId', async function(req, res, next) {
    let context = await getForum(req.params.forumId);
    if (context) {
        res.render('forum', context)
    } else {
        res.status(404).send('This forum does not exist. It may have been deleted.')
    }
});


forumRouter.post('/submit/post', async function(req, res, next) {
    const data = req.body;
    let forumId = data.forumId;
    let messageId = data.messageId;
    let timestamp = Date.now();
    switch (data.action) {
        case "ADDTHREAD":
            const forumDoc = new Forum({
                title: data.title,
                views: 0,
                replies: 0,
                date: timestamp,
                messages: [{
                    message: data.message,
                    date: timestamp,
                    poster: data.uid,
                }],
            });
            forumDoc.save(function (err) {
                if (err) console.error("Error adding document: ", err);
            });
            forumId = forumDoc._id;
            break;
        case "ADD":
            await mongoose.model('forums').findOne({_id:forumId})
                .then((forum) => {
                    forum.messages.push({
                        message: data.message,
                        date: timestamp,
                        poster: data.uid,
                    });
                    forum.save();
                })
                .catch((err) => {
                    console.log('Error adding message', err);
                });
            break;
        case "DELETE":
            Forum.updateOne({_id: forumId},
                {$pull: {messages: {_id: messageId}}},
                function(err, status) {
                    if (err) console.log(err);
                }
            );
            break;
        case "EDIT":
            Forum.updateOne({_id: forumId, 'messages._id': messageId},
                {'$set': {
                    'messages.$.message': data.message,
                }},
                function(err, status) {
                    if (err) console.log(err);
                });
            break;
    }
    let respData = {};  // send a blank response to have the page reloaded
    if (data.action === "ADDTHREAD") {
        respData = {"forumId": forumId};
    }
    await res.json(respData);
});

// forum user view
forumRouter.get('/user/:uid', async function(req, res) {
    const userData = await getUserDataUid(req.params.uid);
    const context = {
        userData: [
            'Name: ' + userData.name,
            'Email: ' + userData.email,
            'Member Since: ' + userData.memberSince,
        ]
    };
    res.render('user', context);
});

module.exports = forumRouter;