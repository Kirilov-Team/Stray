const express = require('express');
const path = require('path');
const { dbo, insertUser, edit_email_verified, addPost, updateToken, updateRefreshToken, updateTokenExpiration, fetchRandomPost, addComment, fetchComments, changeUserName, updateProfilePicture, fetchMessages, sendMessage, fetchChat } = require('./db');
const { encrypt_data, decrypt_data } = require('./encryption');
const { sendVerificationEmail } = require('./email');
const upload = require('./uploads');
const jwt = require('jsonwebtoken');

const router = express.Router();

var rand = function () {
    return Math.random().toString(36).substr(2);
};

var token = function () {
    return rand() + rand() + rand() + "-" + rand() + rand() + rand();
};

router.get("/", (req, res) => {
    console.log(req.ip + " visited the website!");
    res.redirect("/autologin");
});

router.get("/confirm_email", (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/html/confirm_mail.html'));
});

router.get("/mobile", (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/html/mobile.html'));
});

router.get("/confirm_email_success", (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/html/confirm_mail_success.html'));
});

router.get("/confirm_email_error", (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/html/confirm_email_error.html'));
});

router.get('/verify/:token', async function (req, res) {
    const token = req.params.token;
    if (!token) {
        return res.status(400).json({ message: 'Token must be provided' });
    }

    var user = await dbo.collection("users").findOne({ email_token: token });
    try {
        const decoded = jwt.verify(token, user.email_key);
        res.redirect("/confirm_email_success");
        edit_email_verified(token);
    } catch (err) {
        res.redirect("/confirm_email_error");
    }
});

router.get('/css/style.css', function (req, res) {
    res.sendFile(__dirname + "/" + "style.css");
});

router.get('/register/style.css', function (req, res) {
    res.sendFile(__dirname + "/" + "register.css");
});

router.get('/app/style.css', function (req, res) {
    res.sendFile(__dirname + "/" + "index.css");
});

router.get("/api/get_random_number", (req, res) => {
    console.log("Sending random number to " + req.ip);
    let randomi = Math.random();
    res.json(randomi);
});

router.get('/app', function (req, res) {
    console.log(req.ip + " is redirected to the app!");
    res.sendFile(path.join(process.cwd(), 'public/html/index.html'));
});

router.get('/app/profile', function (req, res) {
    console.log(req.ip + " viewed profile!");
    res.sendFile(path.join(process.cwd(), 'public/html/time-line.html'));
});

router.get('/app/messages', function (req, res) {
    res.sendFile(path.join(process.cwd(), 'public/html/private-messages.html'));
});

router.get('/login', function (req, res) {
    console.log(req.ip + " is redirected to login!");
    res.sendFile(path.join(process.cwd(), 'public/html/login.html'));
});

router.get('/autologin', function (req, res) {
    console.log(req.ip + " redirected to autologin!");
    res.sendFile(path.join(process.cwd(), 'public/html/autologin.html'));
});

router.get('/register', function (req, res) {
    console.log(req.ip + " redirected to register!");
    res.sendFile(path.join(process.cwd(), 'public/html/register.html'));
});

router.post('/api/login', async function (req, res) {
    let ip = req.ip;
    const check_data = { username: req.body.username };
    const data = await dbo.collection("users").findOne(check_data);
    var token_ = token();
    var refresh_token = token();
    if (data && decrypt_data(data.password) == req.body.password) {
        console.log(ip + " logged in as " + req.body.username);
        updateToken(req.body.username, token_, ip);
        updateRefreshToken(req.body.username, refresh_token, ip);
        res.json(JSON.stringify({
            message: "Success!",
            ok: true,
            redirect: true,
            url_to_redirect: "/app",
            refresh_token: refresh_token,
            token: token_
        }));
    } else {
        console.log(ip + " tried to login as " + req.body.username);
        res.json(JSON.stringify({
            message: "Failure!",
            ok: false,
            redirect: false,
            url_to_redirect: null,
        }));
    }
});

router.post('/api/post', upload.single('file'), async function (req, res) {
    console.log(req.body);
    console.log(req.file)
    const check_data = { token: req.body.user_token };
    const data = await dbo.collection("users").findOne(check_data);
    if (!data) {
        return res.status(404).json({ error: "User not found" });
    }
    console.log(`${req.ip} posted: "${req.body.text}" as ${data.username})`);
    const now = new Date();
    let image = null;
    try {
        image = {
            name: req.file.originalname,
            img: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            },
            username: data.username,
            createdAt: now
        };
    } catch (error) {
        image = null;
    }
    addPost(req.body.text, now, data.username, image);
});

router.get('/api/get_new_post', async function (req, res) {
    console.log("Sending content to " + req.ip);
    const latestDocument = await dbo.collection("posts").find().sort({ createdAt: -1 }).limit(1).toArray();
    console.log('Latest Document:', latestDocument[0]);
    res.json(JSON.stringify({
        message: latestDocument[0].content,
        ok: false,
        redirect: false,
        url_to_redirect: null,
    }));
});

router.get('/api/get_user_details', async (req, res) => {
    const { username } = req.query;
    try {
        const user = await dbo.collection("users").findOne({ username: username });
        if (user) {
            res.status(200).json({
                username: user.username,
                profilePicture: user.profilePicture,
                followers: user.followers || 0,
                role: user.role || 'User'
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

router.post('/api/register', async function (req, res) {
    let ip = req.ip;
    const data = await dbo.collection("users").findOne({ username: req.body.username });
    if (!data) {
        let password = encrypt_data(req.body.password);
        email_key = require('crypto').randomBytes(32).toString('hex');
        const token_email_verification = jwt.sign({ data: email_key, iat: Math.floor(Date.now() / 1000) }, email_key, { expiresIn: '10m' });
        sendVerificationEmail(req.body.email, token_email_verification);
        insertUser(req.body.username, password, req.body.email, token_email_verification, false, email_key);
        var token_ = token();
        var refresh_token = token();
        var tokenExpirationDate = new Date();
        tokenExpirationDate.setHours(tokenExpirationDate.getHours() + 4);
        updateToken(req.body.username, token_, ip);
        updateRefreshToken(req.body.username, refresh_token, ip);
        updateTokenExpiration(req.body.username, tokenExpirationDate);
        console.log(req.ip + " registered as " + req.body.username);
        res.json(JSON.stringify({
            token: token_,
            refresh_token: refresh_token,
            ok: true
        }));
    } else {
        console.log(req.ip + " tried to register as " + req.body.username);
        res.json(JSON.stringify({
            ok: false
        }));
    }
});

router.post('/api/login_with_token', async function (req, res) {
    let ip = req.ip;
    console.log(ip + " is trying to autologin!");
    if (req.body.token) {
        const check_data = { token: req.body.token, refreshToken: req.body.refresh_token, tokenIp: ip };
        const data = await dbo.collection("users").findOne(check_data);
        var now = new Date();
        renew = false;
        if (data && data.emailVerified) {
            if (false) {
                renew = true;
            }
            console.log(ip + " was let in!");
            res.json(JSON.stringify({
                message: "Success!",
                renew: renew,
                ok: true,
                redirect: true,
                url_to_redirect: "/app"
            }));
        } else {
            console.log(ip + " was not let in!");
            res.json(JSON.stringify({
                message: "Failure!",
                renew: renew,
                ok: false,
                redirect: false,
                url_to_redirect: null,
            }));
        }
    }
});

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        console.log('req.body:', req.body); // Logs the form data
        console.log('req.file:', req.file); // Logs the file object

        if (!req.file || !req.body.name) {
            return res.status(400).json({ error: 'Image and name are required' });
        }

        const collection = dbo.collection('images');

        const image = {
            name: req.body.name,
            img: {
                data: req.file.buffer, // Now this will contain the file data
                contentType: req.file.mimetype,
            },
        };

        await collection.insertOne(image);
        res.status(200).send('Image uploaded successfully');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

router.get('/api/get_post', async (req, res) => {
    try {
        const post = await fetchRandomPost();
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching posts');
    }
});

router.get('/get_post', async (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/html/post.html'));
});

// Add comment to a post
router.post('/api/add_comment', async (req, res) => {
    const { postId, user, date, text } = req.body;
    try {
        await addComment(postId, user, date, text);
        res.status(200).json({ message: 'Comment added successfully' });
        console.log("Success");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Retrieve comments for a post
router.get('/api/get_comments/:postId', async (req, res) => {
    const postId = req.params.postId;
    try {
        const comments = await fetchComments(postId);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

router.post('/api/update_profile_picture', upload.single('profilePicture'), async (req, res) => {
    const { username } = req.body;
    try {
        const profilePicture = {
            data: req.file.buffer,
            contentType: req.file.mimetype
        };
        await updateProfilePicture(username, profilePicture);
        res.status(200).json({ message: 'Profile picture updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});

// Change username
router.post('/api/change_username', async (req, res) => {
    const { username, newUsername, token } = req.body;
    try {
        await changeUserName(username, newUsername, token);
        res.status(200).json({ message: 'Username changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to change username' });
    }
});

module.exports = router;
