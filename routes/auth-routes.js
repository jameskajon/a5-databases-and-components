const express = require('express');
const authRouter = express.Router();

const firebaseAdmin = require("firebase-admin");
const auth = firebaseAdmin.auth();

authRouter.post('/sign-up', async (req, res) => {
    const data = req.body;
    console.log(data);
    auth.createUser({
            email: data.email,
            emailVerified: false,
            // phoneNumber: '+11234567890',
            password: data.password,
            displayName: data.name,
            // photoURL: 'http://www.example.com/12345678/photo.png',
            disabled: false
        })
            .then(async function(userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log('Successfully created new user:', userRecord.uid);
                await res.json({
                    customToken: await getCustomToken(userRecord),
                });
            })
            .catch(function(error) {
                console.log('Error creating new user:', error);
                res.json({
                    failMsg: error.message,
                });
            });

});

async function getCustomToken(user) {
    return await firebaseAdmin.auth().createCustomToken(user.uid)
        .then(function(customToken) {
            return customToken;
        })
        .catch(function(error) {
            console.log('Error creating custom token:', error);
        });
}

// auth sign out
// sign out handled from front end
// authRouter.post('/sign-out', (req, res) => {
//
// });

// auth with google
authRouter.get('/google', (req, res) => {
    // todo passport
    res.send('logging in with google');
});




// // Delete users from the beginning, 80 at a time.
// function deleteAllUsers(nextPageToken) {
//     // List batch of users, 80 at a time.
//     auth.listUsers(80, nextPageToken)
//         .then(function(listUsersResult) {
//             listUsersResult.users.forEach(function(userRecord) {
//                 console.log('Deleting', userRecord.displayName);
//                 auth.deleteUser(userRecord.uid).catch(function(error) {
//                     console.log('Error deleting user:', error);
//                 });
//             });
//             if (listUsersResult.pageToken) {
//                 // List next batch of users.
//                 listAllUsers(listUsersResult.pageToken);
//             }
//         })
//         .catch(function(error) {
//             console.log('Error listing users:', error);
//         });
// }
// deleteAllUsers();

// // create anon account
// function createAnon() {
//     console.log('anon created');
//     auth.createUser({
//         // email: 'anon@anon.anon',
//         emailVerified: false,
//         // phoneNumber: '+11234567890',
//         password: 'Anons account is disabled. Sorry!',
//         displayName: 'anonymous',
//         // photoURL: 'http://www.example.com/12345678/photo.png',
//         disabled: true
//     })
//
// }
// createAnon();

module.exports = authRouter;
