var aes256 = require('aes256');
const key = "abc";
var cipher = aes256.createCipher(key);


function encrypt_data(plaintext) {
    var encryptedPlainText = cipher.encrypt(plaintext);
    return encryptedPlainText;
}

function decrypt_data(encryptedPlainText) {
    var decryptedPlainText = cipher.decrypt(encryptedPlainText);
    return decryptedPlainText;
}



module.exports = { encrypt_data, decrypt_data };