document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("gentile-form");
  const input = document.getElementById("ville-input");
  const resultBox = document.getElementById("gentile-result");

  if (!form || !input || !resultBox) return;

  let data = [];

  // Charge les données
  fetch("/data/gentiles.json")
    .then(res => res.json())
    .then(json => {
      data = json;
    })
    .catch(() => {
      resultBox.hidden = false;
      resultBox.innerHTML = "<p>Impossible de charger la base de données des gentilés.</p>";
    });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const query = input.value.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (!query) return;

    const found = data.find(item => {
      const ville = item.ville.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return ville === query || ville.startsWith(query);
    });

    resultBox.hidden = false;

    if (found) {
      resultBox.innerHTML = `
        <div class="gentile-card">
          <h3>${found.ville}</h3>
          <p class="gentile-name"><strong>Gentilé :</strong> ${found.gentile}</p>
          <p><strong>Population :</strong> ${found.population} habitants</p>
          <p><strong>Département :</strong> ${found.departement}</p>
          <p>${found.description}</p>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <p>Aucun gentilé trouvé pour « ${input.value} ».</p>
        <p>Essaie avec une autre orthographe ou une ville plus importante. La base est encore en cours d’enrichissement.</p>
      `;
    }
  });
});