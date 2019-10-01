function submit(e, url, dataParser, handelResponse) {
    console.log(e, url, dataParser, handelResponse);
    e.preventDefault();  // prevent url form submission

    const jsonData = dataParser();
    const data = JSON.stringify(jsonData);
    console.log("form data: ", data);

    if (jsonData.warningStatus === "failed") {
        const warning = e.target.parentElement.parentElement.querySelector('div#warningAlerts span');
        warning.textContent = jsonData.warningMsg;
        warning.parentElement.classList.remove('d-none');
        return false;
    }

    let request = new Request(url, {
        method: 'POST',
        body: data,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log(request);

    fetch(request)
        .then((resp) => resp.json())
        .then(function( data ) {
            // do something with the response
            console.log( data );
            handelResponse(data);
        })
        .catch(function (error) {
            console.log( error );
        });
    console.log('done submitting');
    return false;
}

function signInSubmit(e, dataParser, handelResponse) {
    console.log(e, dataParser, handelResponse);
    e.preventDefault();  // prevent url form submission

    const data = dataParser();
    console.log("signing in: ", data);
    console.log( data );
    handelResponse(data);

}



// add model submit button events and model activation events
window.onload = async function() {
    const submitUrl = '/submit/create';
    const submitAuthSignUpUrl = '/auth/sign-up';
    // bind sign in and sign up events
    document.getElementById("signInSubmitBtn").onclick = ((e) => signInSubmit(e, parseSignInForm, handelSignInResponse));
    document.getElementById("signUpSubmitBtn").onclick = ((e) => submit(e, submitAuthSignUpUrl, parseSignUpForm, handelSignUpResponse));
    // bind page specific events
    if (document.getElementById("addThreadSubmitBtn")) {
        // if on index
        document.getElementById("addThreadSubmitBtn").onclick = ((e) => submit(e, submitUrl, parseAddThreadForm, handelAddThreadResponse));
    } else {
        // if on forum page
        document.getElementById("addSubmitBtn").onclick = ((e) => submit(e, submitUrl, parseAddForm, handelAddResponse));
        document.getElementById("deleteSubmitBtn").onclick = ((e) => submit(e, submitUrl, parseDeleteForm, handelDeleteResponse));
        document.getElementById("editSubmitBtn").onclick = ((e) => submit(e, submitUrl, parseEditForm, handelEditResponse));
        // transfer data from button press to forum
        for (let addBtn of document.getElementsByClassName('add-btn')) {
            addBtn.onclick = addClick;
        }
        for (let deleteBtn of document.getElementsByClassName('delete-btn')) {
            deleteBtn.onclick = deleteClick;
        }
        for (let editBtn of document.getElementsByClassName('edit-btn')) {
            editBtn.onclick = editClick;
        }
    }
};


// Track current message and forum id so that info can be sent to the backend on a post

let curMessageId;
let curForumId;
let curMessageUid;

function addClick(btn) {
    curForumId = btn.target.dataset.forumid;
}

function deleteClick(btn) {
    let link = btn.target.parentElement;
    curMessageId = link.dataset.messageid;
    curForumId = document.querySelector('.add-btn').dataset.forumid;
    curMessageUid = link.parentElement.parentElement.querySelector('a').dataset.uid;
    // hide alert
    document.querySelector('#deleteFormModal div.alert').classList.add('d-none');
}

function editClick(btn) {
    let link = btn.target.parentElement;
    curMessageId = link.dataset.messageid;
    curForumId = document.querySelector('.add-btn').dataset.forumid;
    curMessageUid = link.parentElement.parentElement.querySelector('a').dataset.uid;
    // hide alert
    document.querySelector('#editFormModal div.alert').classList.add('d-none');

    let curText = link.parentElement.parentElement.parentElement.lastElementChild.textContent.trim();
    let editMotelMessage = document.querySelector("#editFormModal textarea#edit-message");
    editMotelMessage.value = curText;
}


// CLOSE MODAL //

// will remove all modal backdrops
function closeModal(modal) {
    modal.querySelector('.modal-header > button.close').click();
    modal.querySelector('form').reset();
    modal.querySelector('.alert').classList.remove('d-none')
}

// function closeModalAlert(modal) {
//     modal.querySelector('.alert > button.close').click();
// }


// PARSE FORM //

function parseAddThreadForm() {

    return {
        action: "ADDTHREAD",
        title: document.getElementById("title").value,
        message: document.getElementById("add-thread-message").value,
        ...getCurUid(),
    }
}

function parseAddForm() {
    console.log("ran parse add");
    return {
        action: "ADD",
        forumId: curForumId,
        message: document.querySelector("#addFormModal textarea#add-message").value,
        ...getCurUid(),
    }
}

function parseDeleteForm() {
    return {
        action: "DELETE",
        messageId: curMessageId,
        forumId: curForumId,
        ...modifyingAllowed(),
        ...getCurUid(),
    }
}

function parseEditForm() {
    return {
        action: "EDIT",
        messageId: curMessageId,
        forumId: curForumId,
        message: document.querySelector("#editFormModal textarea#edit-message").value,
        ...modifyingAllowed(),
        ...getCurUid(),
    }
}

function parseSignInForm() {
    return {
        email: document.getElementById("sign-in-email").value,
        password: document.getElementById("sign-in-password").value,
    }
}

function parseSignUpForm() {
    return {
        name: document.getElementById("sign-up-name").value,
        email: document.getElementById("sign-up-email").value,
        password: document.getElementById("sign-up-password").value,
    }
}


// HANDEL RESPONSE //

function handelAddThreadResponse(data) {
    // change page to the new forum page
    if (data.forumId) {
        location = "/forum/" + data.forumId;
    } else {
        location.reload();
    }
}

function handelAddResponse(data) {
    // refresh the page to show added message
    location.reload();
}

function handelDeleteResponse(data) {
    // refresh the page to show the message was deleted
    location.reload();
}

function handelEditResponse(data) {
    // refresh the page to show the edited message
    location.reload();
}

// sign in's are done client side
async function handelSignInResponse(data) {
    firebaseSignInEmailPassword(data.email, data.password)
        .then(function() {
            const modal = document.getElementById('signInFormModal');
            closeModal(modal);
            console.log("you are now logged in");
        })
        .catch(function(error) {
            console.log("sign in failed");
            console.log(error.message);
            document.querySelector('#sign-in-alert > span').textContent = error.message;
            document.getElementById('sign-in-alert').classList.remove('d-none');
        });
}

async function handelSignUpResponse(data) {
    if (await firebaseSignInToken(data.customToken) === true) {
        const modal = document.getElementById('signUpFormModal');
        closeModal(modal);
        console.log("you are now logged in");
    } else {
        console.log("sign up failed");
        console.log(data.failMsg);
        if (data.failMsg) {
            document.querySelector('#sign-up-alert > span').textContent = data.failMsg;
            document.getElementById('sign-up-alert').classList.remove('d-none');
        }
    }
    // update();
}


// FIREBASE AUTH //

const auth = firebase.auth();

// get uid to send to backend
function getCurUid() {
    const user  = auth.currentUser;
    if (user === null || user === undefined) {
        return {
            warningStatus: "failed",
            warningMsg: "Please sign in before you perform this action.",
        }
    } else {
        return {
            uid: user.uid,
        }
    }
}

// get uid to send to backend
function modifyingAllowed() {
    const uid  = (auth.currentUser !== null) ? auth.currentUser.uid : null;
    if (uid !== curMessageUid) {
        return {
            warningStatus: "failed",
            warningMsg: "You do not have permission to modify this message.",
        }
    }
}

async function firebaseSignInToken(token) {
    if (typeof token !== "string") {
        // if token is bad dont bother trying to sign in
        return false;
    }
    return await auth.signInWithCustomToken(token)
        .then(function() {
            return true;
        })
        .catch(function(error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        return false;
        });
}

async function firebaseSignInEmailPassword(email, password) {
    if (typeof email !== "string" || typeof password !== "string") {
        // if creds are bad dont bother trying to sign in
        return false;
    }
    return auth.signInWithEmailAndPassword(email, password);
}

async function firebaseSignOut() {
    return await auth.signOut()
        .then(function() {
            console.log('user signed out');
            // update();
        })
}

// DISPLAY USER //

firebase.auth().onAuthStateChanged(update);

function update(user) {
    if (user === null || user === undefined) {
        user = auth.currentUser;
    }
    updateNavButtons(user);
    updateNavName(user);
}

function updateNavButtons(user) {
    if (user === null || user === undefined) {
        document.getElementById('signUpBtn').classList.remove('d-none');
        document.getElementById('signInMenuDiv').classList.remove('d-none');
        document.getElementById('signOutBtn').classList.add('d-none');
    } else {
        document.getElementById('signUpBtn').classList.add('d-none');
        document.getElementById('signInMenuDiv').classList.add('d-none');
        document.getElementById('signOutBtn').classList.remove('d-none');
    }
}

function updateNavName(user) {
    document.querySelector('nav> #userDisplayName').textContent = (user === null || user === undefined) ? "" : "Welcome " + user.displayName;
}


// OAuth //

function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    provider.addScope('profile');
    provider.addScope('email');
    auth.signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const token = result.credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log('Google user signed in ', result.credential.accessToken, result.user)
    }).catch(function(error) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            alert('You have signed up with a different provider for that email.');
            // Handle linking here if your app allows it.
        } else {
            console.log("Google sign in error", error)
        }
    });
}

function githubSignIn() {
    const provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('read:user');
    provider.addScope('user:email');
    auth.signInWithPopup(provider).then(function(result) {
        console.log('Github user signed in ', result.credential.accessToken, result.user)
    }).catch(function(error) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            alert('You have signed up with a different provider for that email.');
            // Handle linking here if your app allows it.
        } else {
            console.error("Github sign in error", error);
        }
    });

}



