document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("gentile-form");
  const input = document.getElementById("ville-input");
  const resultBox = document.getElementById("gentile-result");

  if (!form || !input || !resultBox) {
    console.error("Éléments de l'outil gentilé introuvables");
    return;
  }

  let data = [];

  // Charge les données
  fetch("/data/gentiles.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Erreur de chargement JSON");
      return res.json();
    })
    .then(function (json) {
      data = json;
      console.log("Base gentilés chargée :", data.length, "villes");
    })
    .catch(function (err) {
      console.error(err);
      resultBox.hidden = false;
      resultBox.innerHTML = "<p>Impossible de charger la base de données des gentilés.</p>";
    });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const rawQuery = input.value.trim();
    if (!rawQuery) return;

    const query = rawQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const found = data.find(function (item) {
      const ville = item.ville
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return ville === query || ville.startsWith(query);
    });

    resultBox.hidden = false;

    if (found) {
      resultBox.innerHTML =
        '<div class="gentile-card">' +
          "<h3>" + found.ville + "</h3>" +
          '<p class="gentile-name"><strong>Gentilé :</strong> ' + found.gentile + "</p>" +
          "<p><strong>Population :</strong> " + found.population + " habitants</p>" +
          "<p><strong>Département :</strong> " + found.departement + "</p>" +
          "<p>" + found.description + "</p>" +
        "</div>";
    } else {
      resultBox.innerHTML =
        "<p>Aucun gentilé trouvé pour « " + rawQuery + " ».</p>" +
        "<p>Essaie avec une autre orthographe ou une ville plus importante. La base est encore en cours d’enrichissement.</p>";
    }

    // Fait défiler doucement jusqu'au résultat
    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});