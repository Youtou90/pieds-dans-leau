/* Pieds dans l'eau : comportements du site (menu, WhatsApp, carte, galerie, réservation). */
(function () {
  var C = window.CONTENU || {};

  function lienWhatsApp(message) {
    return "https://wa.me/" + C.whatsapp + (message ? "?text=" + encodeURIComponent(message) : "");
  }
  function echapper(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Menu sur téléphone */
  var bouton = document.querySelector(".nav-bouton");
  var nav = document.getElementById("nav");
  if (bouton && nav) {
    bouton.addEventListener("click", function () {
      var ouvert = nav.classList.toggle("ouvert");
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
  }

  /* Année du copyright */
  document.querySelectorAll("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Liens WhatsApp avec message pré-rempli : <a data-wa="Bonjour…"> */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = lienWhatsApp(a.getAttribute("data-wa"));
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* La carte */
  var icones = {
    grillades: '<path d="M4 10h16M6 10l1.5 9h9L18 10M9 6c0-1 1-1.5 1-2.5M13 6c0-1 1-1.5 1-2.5"/>',
    poissons: '<path d="M3 12c3-4 7-5 11-4 2 .5 3.5 2 4.5 4-1 2-2.5 3.5-4.5 4-4 1-8 0-11-4Zm15.5 0L21 9v6l-2.5-3Z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/>',
    pays: '<path d="M3 12h18a9 9 0 0 1-18 0Zm3-3c1-2 2-2 3-1s2 1 3-1 2-1 3 0 2 1 3-1"/>',
    boissons: '<path d="M7 3h10l-1 18H8L7 3Zm.4 6h9.2"/>'
  };
  function htmlPlat(p) {
    var visuel = p.photo
      ? '<img src="' + echapper(p.photo) + '" alt="' + echapper(p.nom) + '" loading="lazy" width="400" height="300">'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icones[p.categorie] || icones.pays) + "</svg>";
    var pied = p.disponible
      ? '<span class="etiquette e-dispo">Disponible</span><a class="lien-commande" target="_blank" rel="noopener" href="' +
        lienWhatsApp("Bonjour Pieds dans l'eau ! Je voudrais commander : " + p.nom + ".") + '" aria-label="Commander ' + echapper(p.nom) + ' sur WhatsApp">Commander</a>'
      : '<span class="etiquette e-epuise">Épuisé aujourd\'hui</span>';
    return '<article class="plat' + (p.photo ? "" : " sans-photo") + (p.disponible ? "" : " epuise") + '">' +
      '<div class="plat-visuel">' + visuel + "</div>" +
      '<div class="plat-corps"><div class="plat-tete"><h3>' + echapper(p.nom) + "</h3>" +
      (p.prix ? '<span class="prix">' + echapper(p.prix) + "</span>" : "") + "</div>" +
      "<p>" + echapper(p.description) + "</p>" +
      '<div class="plat-pied">' + pied + "</div></div></article>";
  }

  var zoneCarte = document.getElementById("carte");
  if (zoneCarte && C.carte) {
    var filtres = document.getElementById("filtres");
    var cles = Object.keys(C.categories);
    function afficher(filtre) {
      zoneCarte.innerHTML = cles.filter(function (k) { return filtre === "tout" || filtre === k; }).map(function (k) {
        var plats = C.carte.filter(function (p) { return p.categorie === k; });
        if (!plats.length) return "";
        return '<section class="categorie" aria-labelledby="cat-' + k + '"><h2 id="cat-' + k + '">' + echapper(C.categories[k]) +
          " <small>" + plats.length + (plats.length > 1 ? " choix" : " choix") + "</small></h2>" +
          '<div class="grille g3">' + plats.map(htmlPlat).join("") + "</div></section>";
      }).join("");
    }
    if (filtres) {
      filtres.innerHTML = '<button class="filtre" type="button" data-filtre="tout" aria-pressed="true">Tout</button>' +
        cles.map(function (k) { return '<button class="filtre" type="button" data-filtre="' + k + '" aria-pressed="false">' + echapper(C.categories[k]) + "</button>"; }).join("");
      filtres.addEventListener("click", function (e) {
        var b = e.target.closest(".filtre");
        if (!b) return;
        filtres.querySelectorAll(".filtre").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        afficher(b.getAttribute("data-filtre"));
      });
    }
    afficher("tout");
  }

  /* Aperçu de la carte sur l'accueil */
  var apercu = document.getElementById("apercu-carte");
  if (apercu && C.carte) {
    apercu.innerHTML = C.carte.filter(function (p) { return p.disponible; }).slice(0, 3).map(htmlPlat).join("");
  }

  /* La galerie */
  var galerie = document.getElementById("galerie");
  if (galerie) {
    var items = C.galerie || [];
    if (!items.length) {
      document.getElementById("galerie-vide").hidden = false;
    } else {
      galerie.hidden = false;
      galerie.innerHTML = items.map(function (it, i) {
        if (it.type === "video") {
          return '<figure><video src="' + echapper(it.fichier) + '" controls preload="metadata" playsinline></video>' +
            '<span class="video-marque">Vidéo</span>' + (it.legende ? "<figcaption>" + echapper(it.legende) + "</figcaption>" : "") + "</figure>";
        }
        return '<figure><button type="button" data-i="' + i + '" aria-label="Agrandir : ' + echapper(it.legende || "photo") + '">' +
          '<img src="' + echapper(it.fichier) + '" alt="' + echapper(it.legende || "") + '" loading="lazy"></button>' +
          (it.legende ? "<figcaption>" + echapper(it.legende) + "</figcaption>" : "") + "</figure>";
      }).join("");
      var vis = document.getElementById("visionneuse");
      galerie.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-i]");
        if (!b || !vis || !vis.showModal) return;
        var it = items[+b.getAttribute("data-i")];
        vis.querySelector("img").src = it.fichier;
        vis.querySelector("img").alt = it.legende || "";
        vis.querySelector("p").textContent = it.legende || "";
        vis.showModal();
      });
      if (vis) {
        vis.querySelector(".fermer").addEventListener("click", function () { vis.close(); });
        vis.addEventListener("click", function (e) { if (e.target === vis) vis.close(); });
      }
    }
  }

  /* Réservation : prépare un message WhatsApp, aucune donnée n'est envoyée ailleurs */
  var form = document.getElementById("form-resa");
  if (form) {
    var date = form.querySelector("#resa-date");
    if (date) date.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (champ) {
        var bloc = champ.closest(".champ");
        var vide = !champ.value.trim();
        bloc.classList.toggle("erreur", vide);
        var msg = bloc.querySelector(".msg-erreur");
        if (msg) msg.hidden = !vide;
        if (vide && ok) { champ.focus(); ok = false; }
      });
      if (!ok) return;
      var v = function (id) { var el = form.querySelector("#" + id); return el ? el.value.trim() : ""; };
      var d = v("resa-date") ? new Date(v("resa-date") + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
      var texte = "Bonjour Pieds dans l'eau ! Je souhaite réserver une table.\n" +
        "Nom : " + v("resa-nom") + "\n" +
        "Date : " + d + (v("resa-heure") ? " vers " + v("resa-heure") : "") + "\n" +
        "Nombre de personnes : " + v("resa-personnes") +
        (v("resa-occasion") ? "\nOccasion : " + v("resa-occasion") : "") +
        (v("resa-message") ? "\nPrécisions : " + v("resa-message") : "");
      window.open(lienWhatsApp(texte), "_blank", "noopener");
    });
  }
})();
