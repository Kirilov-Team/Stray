const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.db_uri;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);

var dbo = client.db("social_media");

async function insertUser(user, password_, email, email_token, emailVerified, email_key) {
    var data = { username: user, password: password_, email: email, email_token: email_token, emailVerified: emailVerified, email_key: email_key };
    dbo.collection("users").insertOne(data);
}

async function edit_email_verified(email_token) {
    var myquery = { email_token: email_token };
    var newvalues = { $set: { emailVerified: true } };
    dbo.collection("users").updateOne(myquery, newvalues);
}

async function addPost(content, date, user, image) {
    var data = { content: content, user: user, date: date, image: image, comments: [] };
    dbo.collection("posts").insertOne(data);
}

async function updateToken(user, token, ip) {
    var myquery = { username: user };
    var newvalues = { $set: { token: token, tokenIp: ip } };
    dbo.collection("users").updateOne(myquery, newvalues);
}

async function updateRefreshToken(user, token, ip) {
    var myquery = { username: user };
    var newvalues = { $set: { refreshToken: token, tokenIp: ip } };
    dbo.collection("users").updateOne(myquery, newvalues);
}

async function updateTokenExpiration(user, tokenExpiration) {
    var myquery = { username: user };
    var newvalues = { $set: { tokenExpiration: tokenExpiration } };
    dbo.collection("users").updateOne(myquery, newvalues);
}

async function fetchAllPosts(limit = 100) {
    const posts = await dbo.collection('posts').find().limit(limit).toArray();
    return posts;
}

async function fetchRandomPost() {
    const count = await dbo.collection('posts').countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const randomPost = await dbo.collection('posts').find().limit(1).skip(randomIndex).toArray();
    if (randomPost.length > 0) {
        const user = await dbo.collection('users').findOne({ username: randomPost[0].user }, { projection: { profilePicture: 1 } });
        randomPost[0].userProfilePicture = user ? user.profilePicture : null;
    }
    return randomPost[0];
}

async function addComment(postId, user, date, text) {
    const myquery = { _id: new ObjectId(postId) };
    const newvalues = { $push: { comments: { user, date, text } } };
    await dbo.collection("posts").updateOne(myquery, newvalues);
}

async function fetchComments(postId) {
    const post = await dbo.collection("posts").findOne({ _id: new ObjectId(postId) }, { projection: { comments: 1 } });
    return post ? post.comments : [];
}

// Function to verify user identity
async function verifyUser(user, token) {
    const userRecord = await dbo.collection("users").findOne({ username: user, token: token });
    return userRecord !== null;
}

async function changeUserName(user, newName, token) {
    try {
        const isVerified = await verifyUser(user, token);
        if (!isVerified) {
            throw new Error("User verification failed");
        }
        const myquery = { username: user };
        const newvalues = { $set: { username: newName } };
        await dbo.collection("users").updateOne(myquery, newvalues);
    } catch (error) {
        console.error("Error changing username", error);
    }
}

async function updateProfilePicture(username, profilePicture) {
    const myquery = { username: username };
    const newvalues = { $set: { profilePicture: profilePicture } };
    await dbo.collection("users").updateOne(myquery, newvalues);
}




module.exports = {
    client,
    dbo,
    insertUser,
    edit_email_verified,
    addPost,
    updateToken,
    updateRefreshToken,
    updateTokenExpiration,
    fetchAllPosts,
    fetchRandomPost,
    addComment,
    fetchComments,
    changeUserName,
    updateProfilePicture
};

