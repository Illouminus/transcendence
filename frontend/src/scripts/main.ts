import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";

document.addEventListener("DOMContentLoaded", async () => {
	await setupUI();
	handleRouting();
});
