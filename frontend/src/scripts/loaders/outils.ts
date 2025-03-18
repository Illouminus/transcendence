import { redirectTo } from "../router";

export async function fetchAndRender(page: string) {
	const response = await fetch(`./src/pages/${page}.html`);
	if (!response.ok) throw new Error(`Error loading ${page}`);
	document.getElementById("app")!.innerHTML = await response.text();
}


export async function fetchBabylon(page: string) {
    const response = await fetch(`./src/pages/${page}.html`);
    if (!response.ok) throw new Error(`Error loading ${page}`);
    const html = await response.text();
    const appDiv = document.getElementById("app")!;
    appDiv.innerHTML = html;
    

    // Re-exécuter les scripts du fichier HTML inséré
    appDiv.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        newScript.type = "module"; // Assurez-vous que le type correspond
        if (oldScript.src) {
            newScript.src = oldScript.src;
        } else {
            newScript.textContent = oldScript.textContent;
        }
        oldScript.replaceWith(newScript);
    });
}
