function postContent() {
	console.log("called function");


	var element_ = document.getElementById("post_text");
	console.log(element_.value);

	var body_ = new FormData();
	body_.append("text", element_.value);
	body_.append("user_token", localStorage['token'] || 'defaultValue');

	var fileInput = document.getElementById("image_input");
	if (fileInput.files.length > 0) {
		body_.append("file", fileInput.files[0]);
	}

	console.log(body_)


	fetch("/api/post", {
		method: "POST",
		body: body_
	});

	document.getElementById("post_text").value = "";
	var button = document.getElementById("send_button");
	button.innerText = "Siker!";

	// Change the text back after 2 seconds
	setTimeout(function () {
		button.innerText = "Mehet!";
	}, 1000);
}