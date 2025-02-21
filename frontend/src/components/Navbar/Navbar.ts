// src/components/Navbar.ts
export class Navbar {
  async render(): Promise<HTMLElement> {
    try {
      // Charger le fichier HTML
      const response = await fetch("./src/components/Navbar/navbar.html");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du fichier Navbar.html");
      }

      // Lire le contenu HTML et convertir en élément DOM
      const htmlText = await response.text();
      const template = document.createElement("template");
      template.innerHTML = htmlText.trim(); // Éviter les espaces blancs inutiles
      const navbarElement = template.content.firstElementChild as HTMLElement;

      return navbarElement;
    } catch (error) {
      console.error("Erreur lors du rendu de la Navbar :", error);
      throw error;
    }
  }
}
