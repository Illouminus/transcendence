import { redirectTo } from "../router";
import { loadPongPage } from "./loaders";

export async function fetchAndRender(page: string) {
	const response = await fetch(`./src/pages/${page}.html`);
	if (!response.ok) throw new Error(`Error loading ${page}`);
	document.getElementById("app")!.innerHTML = await response.text();
}


