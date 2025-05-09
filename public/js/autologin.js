function login_token() {
    var body_ = { token: localStorage['token'] || 'defaultValue', refresh_token: localStorage['refreshToken'] || 'defaultValue' }
    body_ = JSON.stringify(body_);
    fetch("/api/login_with_token",
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
            let url_to_redirect = data.url_to_redirect;
            let token = data.token;
            let refreshToken = data.refresh_token;
            let renew = data.renew;
            if (!renew) {
                if (url_to_redirect != null && url_to_redirect != "" && url_to_redirect != false) {
                    window.location.replace("/app");
                } else {
                    window.location.replace("/login");
                }
            }

        });
}
login_token()