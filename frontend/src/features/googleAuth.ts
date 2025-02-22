import { redirectTo } from "../scripts/router";

declare var google: any;
const clientId = "747067169-6jotvfqmsp06iq9muu28jq2547q3v32s.apps.googleusercontent.com";


export function renderGoogleButton() {
	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleCredentialResponse,
	});

	const container = document.getElementById("google-signin-button");
	if (container) {
		google.accounts.id.renderButton(container, {
			theme: "outline",
			size: "large",
		});
	}

}

function handleCredentialResponse(response: any) {
	console.log("Encoded JWT ID token: ", response.credential);
	fetch("http://localhost:5555/auth/google-authenticator", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken: response.credential }),
		credentials: "include",
	})
		.then((res) => res.json())
		.then((data) => {
			console.log("Server response:", data);
			window.history.pushState({}, "", "/dashboard");
			redirectTo("/");
		})
		.catch((err) => console.error(err));
}


// window.onload = () => {
// 	google.accounts.id.initialize({
// 		client_id: clientId,
// 		callback: handleCredentialResponse,
// 	});
// };