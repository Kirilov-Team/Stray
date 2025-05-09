function login() {
    let done = false;
    password = document.getElementById("password_bar").value;
    username = document.getElementById("username_bar").value;


    document.getElementById("password_bar").value = "";
    var body_ = { username: username, password: password }
    body_ = JSON.stringify(body_)
    fetch("/api/login",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body_
        })
        .then(response => response.json())
        .then(data => {
            data = JSON.parse(data);
            let message = data.message;
            let ok = data.ok;
            let redirect = data.redirect;
            let url_to_redirect = data.url_to_redirect;
            let refresh_token = data.refresh_token;
            let token = data.token;
            if (url_to_redirect != null && url_to_redirect != "") {
                //document.getElementById("console").textContent = "";
                //document.getElementById("data").textContent = "";
                localStorage['token'] = token;
                localStorage['refreshToken'] = refresh_token;
                localStorage['username'] = username;
                window.location.replace(url_to_redirect);
            } else {
                //document.getElementById("console").textContent = "Hiba!";
                //document.getElementById("data").textContent = "A megadott jelszó helytelen!";
            }
        });
}

function register() {
    let done = false;
    password = document.getElementById("password_bar_reg").value;
    username = document.getElementById("username_bar_reg").value;
    email = document.getElementById("email_bar").value;
    var body_ = { username: username, password: password, email: email }
    body_ = JSON.stringify(body_)
    console.log(body_)
    fetch("/api/register",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body_
        })
        .then(response => response.json())
        .then(data => {
            data = JSON.parse(data);
            let message = data.message;
            let ok = data.ok;
            let redirect = data.redirect;
            let url_to_redirect = data.url_to_redirect;
            let token = data.token;
            let refresh_token = data.refresh_token;
            if (ok) {
                localStorage['token'] = token;
                localStorage['refreshToken'] = refresh_token;
                localStorage['username'] = username;
                window.location.href = "/confirm_email";
            } else {
                document.getElementById("console").textContent = "Hiba!";
                document.getElementById("data").textContent = "Hiba!!";
            }
        });
}


