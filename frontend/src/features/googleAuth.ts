// googleAuth.ts (или main.ts)

// Допустим, вы объявили где-то:
declare var google: any;
const clientId = "747067169-6jotvfqmsp06iq9muu28jq2547q3v32s.apps.googleusercontent.com";




// Эта функция будет вызываться при переходе на страницу логина
export function renderGoogleButton() {
	// Инициализируем Google Accounts (если ещё не инициализировано)
	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleCredentialResponse,
	});

	// Рисуем кнопку в элементе #google-signin-button
	const container = document.getElementById("google-signin-button");
	console.log(container);
	if (container) {
		google.accounts.id.renderButton(container, {
			theme: "outline",
			size: "large",
		});
	}

}

// А это ваш callback, который отправляет idToken на бэкенд
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
			// Можете дальше делать редирект или показывать сообщение
		})
		.catch((err) => console.error(err));
}



window.onload = () => {
	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleCredentialResponse,
	});

};