export type AlertType = "info" | "danger" | "success" | "warning" | "dark";

export function showAlert(message: string, type: AlertType = "info", duration: number = 3000): void {
	const container = document.getElementById("alert-container");
	if (!container) return;

	const alertEl = document.createElement("div");
	alertEl.className = `flex items-center p-4 mb-4 text-sm rounded-lg border ${getAlertClasses(type)}`;
	alertEl.role = "alert";
	alertEl.innerHTML = `
    <svg class="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
    </svg>
    <div>
      <span class="font-medium">${message}
    </div>
  `;

	container.appendChild(alertEl);

	setTimeout(() => {
		alertEl.remove();
	}, duration);
}

function getAlertClasses(type: AlertType): string {
	switch (type) {
		case "info":
			return "text-blue-800 border-blue-300 bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800";
		case "danger":
			return "text-red-800 border-red-300 bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800";
		case "success":
			return "text-green-800 border-green-300 bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800";
		case "warning":
			return "text-yellow-800 border-yellow-300 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800";
		case "dark":
			return "text-gray-800 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
		default:
			return "";
	}
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}