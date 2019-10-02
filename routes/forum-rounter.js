const express = require('express');
const forumRouter = express.Router();
const firebaseAdmin = require("firebase-admin");

const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();







// forum list view
forumRouter.get('/', async function(req, res, next) {
    let forumData = await getForums();
    res.render('index', {title: "The Forums", forumData: forumData})
});

// forum messages view
forumRouter.get('/forum/:forumId', async function(req, res, next) {
    let context = await getForum(req.params.forumId);
    if (context.forumTitle === undefined && context.messages.length === 0) {
        res.status(404).send('This forum does not exist. It may have been deleted.')
    } else {
        db.collection("forums").doc(req.params.forumId).update({views: firebaseAdmin.firestore.FieldValue.increment(1)})
            .then(function() {
                // console.log("Document successfully updated!");
            })
            .catch(function(error) {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });
        res.render('forum', context)
    }
});


forumRouter.post('/submit/create', async function(req, res, next) {
    console.log(req.body);
    const data = req.body;
    let forumId = data.forumId;
    let messageId = data.messageId;
    let addTimestamp = firebaseAdmin.firestore.Timestamp.now();
    switch (data.action) {
        case "ADDTHREAD":
            const newForumData = {
                title: data.title,
                views: 0,
                replies: 0,
                date: addTimestamp,
            };
            let forumDoc = db.collection("forums").add(newForumData)
                .then(function(docRef) {
                    // console.log("Document written with ID: ", docRef.id);
                    return docRef;
                })
                .catch(function(error) {
                    console.error("Error adding document: ", error);
                });
            forumId = (await forumDoc).id;
            // adding message and user handled in ADD case
        case "ADD":

            const newMessageData = {
                message: data.message,
                date: addTimestamp,
                poster: data.uid,
            };
            let messageDoc = db.collection("forums").doc(forumId).collection('messages').add(newMessageData)
                .then(function(docRef) {
                    // console.log("Document written with ID: ", docRef.id);
                    return docRef;
                })
                .catch(function(error) {
                    console.error("Error adding document: ", error);
                });
            if (data.action === "ADD") {
                db.collection("forums").doc(forumId).update({replies: firebaseAdmin.firestore.FieldValue.increment(1)})
                    .then(function() {
                        // console.log("Document successfully updated!");
                    })
                    .catch(function(error) {
                        console.error("Error updating document: ", error);
                    });
            }
            await messageDoc;
            break;
        case "DELETE":
            // console.log("Deleting " + messageId);
            db.collection("forums").doc(forumId).update({replies: firebaseAdmin.firestore.FieldValue.increment(-1)})
                .then(function() {
                    // console.log("Document successfully updated!");
                })
                .catch(function(error) {
                    console.error("Error updating document: ", error);
                });
            await db.collection(`forums/${forumId}/messages`).doc(messageId).delete()
                .then(function() {
                    // console.log("Document successfully deleted!");
                })
                .catch(function(error) {
                    console.error("Error removing document: ", error);
                });
            break;
        case "EDIT":
            // console.log("Editing " + messageId);
            await db.collection(`forums/${forumId}/messages`).doc(messageId).update({
                message: data.message,
            })
                .then(function() {
                    // console.log("Document successfully deleted!");
                })
                .catch(function(error) {
                    console.error("Error removing document: ", error);
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
    // if (context.forumTitle === undefined && context.messages.length === 0) {
    //     res.status(404).send('This forum does not exist. It may have been deleted.')
    // } else {
    console.log(context);
    res.render('user', context);
    // }
});



module.exports = forumRouter;