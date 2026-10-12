/* Pieds dans l'eau : comportements du site
   menu, WhatsApp, « ouvert maintenant », animations, carte, panier, galerie, réservation. */
(function () {
  var C = window.CONTENU || {};
  var mouvementReduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function lienWhatsApp(message) {
    return "https://wa.me/" + C.whatsapp + (message ? "?text=" + encodeURIComponent(message) : "");
  }
  function echapper(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stocker(cle, valeur) { try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) {} }
  function lire(cle, defaut) { try { var v = JSON.parse(localStorage.getItem(cle)); return v == null ? defaut : v; } catch (e) { return defaut; } }
  function montant(prix) { var n = parseInt(String(prix || "").replace(/[^\d]/g, ""), 10); return isNaN(n) ? null : n; }
  function fcfa(n) { return n.toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; }

  /* ---------- Menu sur téléphone ---------- */
  var bouton = document.querySelector(".nav-bouton");
  var nav = document.getElementById("nav");
  if (bouton && nav) {
    bouton.addEventListener("click", function () {
      var ouvert = nav.classList.toggle("ouvert");
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
  }

  /* ---------- Année du copyright ---------- */
  document.querySelectorAll("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Liens WhatsApp pré-remplis : <a data-wa="Bonjour…"> ---------- */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = lienWhatsApp(a.getAttribute("data-wa"));
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ---------- Ouvert maintenant ? (heure de Bertoua, UTC+1) ---------- */
  var h = C.ouverture || { debut: 8, fin: 24 };
  function etatOuverture() {
    var maintenant = new Date();
    var heureBertoua = (maintenant.getUTCHours() + 1 + maintenant.getUTCMinutes() / 60) % 24;
    var ouvert = heureBertoua >= h.debut && heureBertoua < h.fin;
    if (ouvert) {
      var reste = h.fin - heureBertoua;
      return { ouvert: true, texte: reste <= 1 ? "Ouvert, ferme bientôt" : "Ouvert maintenant" };
    }
    return { ouvert: false, texte: "Fermé, ouvre à " + h.debut + " h" };
  }
  function majOuverture() {
    var e = etatOuverture();
    document.querySelectorAll("[data-ouverture]").forEach(function (el) {
      el.textContent = e.texte;
      el.classList.toggle("est-ouvert", e.ouvert);
      el.classList.toggle("est-ferme", !e.ouvert);
    });
  }
  majOuverture();
  setInterval(majOuverture, 60000);

  /* ---------- Apparitions au défilement ---------- */
  function observerApparitions(racine) {
    var elements = (racine || document).querySelectorAll(".revele:not(.vu)");
    if (mouvementReduit || !("IntersectionObserver" in window)) {
      elements.forEach(function (el) { el.classList.add("vu"); });
      return;
    }
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("vu"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    elements.forEach(function (el) { obs.observe(el); });
  }
  document.querySelectorAll(".section-tete, .atouts li, .carte, .info, .activite, .faq details, .scene, .soir .conteneur > *").forEach(function (el, i) {
    el.classList.add("revele");
  });
  document.documentElement.classList.add("js");
  observerApparitions();

  /* ---------- Panier ---------- */
  var panier = lire("pde-panier", {});   // { "Nom du plat": quantité }
  function platParNom(nom) { return (C.carte || []).filter(function (p) { return p.nom === nom; })[0]; }
  function nettoyerPanier() {
    Object.keys(panier).forEach(function (nom) {
      var p = platParNom(nom);
      if (!p || !p.disponible || panier[nom] < 1) delete panier[nom];
    });
  }
  nettoyerPanier();
  function nbArticles() { return Object.keys(panier).reduce(function (s, k) { return s + panier[k]; }, 0); }
  function total() {
    var t = 0, complet = true;
    Object.keys(panier).forEach(function (nom) {
      var m = montant((platParNom(nom) || {}).prix);
      if (m === null) complet = false; else t += m * panier[nom];
    });
    return { valeur: t, complet: complet };
  }
  function changerQuantite(nom, delta) {
    panier[nom] = Math.max(0, (panier[nom] || 0) + delta);
    if (!panier[nom]) delete panier[nom];
    stocker("pde-panier", panier);
    majPanier();
  }

  var I_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var I_MOINS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
  var I_PANIER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h16l-1.5 10.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 9Zm4 0 4-5 4 5"/></svg>';

  function htmlQuantite(nom) {
    var q = panier[nom] || 0;
    var n = echapper(nom);
    if (!q) return '<button class="ajouter" type="button" data-ajouter="' + n + '">' + I_PLUS + "Ajouter</button>";
    return '<div class="quantite" role="group" aria-label="Quantité de ' + n + '">' +
      '<button type="button" data-moins="' + n + '" aria-label="Retirer un ' + n + '">' + I_MOINS + "</button>" +
      '<output aria-live="polite">' + q + "</output>" +
      '<button type="button" data-plus="' + n + '" aria-label="Ajouter un ' + n + '">' + I_PLUS + "</button></div>";
  }

  /* Barre du panier et fenêtre du panier, présentes sur toutes les pages */
  var barre = document.createElement("div");
  barre.className = "barre-panier";
  barre.hidden = true;
  barre.innerHTML = '<button type="button" class="barre-panier-bouton" aria-haspopup="dialog">' + I_PANIER +
    '<span class="barre-panier-texte"></span><span class="barre-panier-voir">Voir le panier</span></button>';
  document.body.appendChild(barre);

  var fenetre = document.createElement("dialog");
  fenetre.className = "fenetre-panier";
  fenetre.setAttribute("aria-labelledby", "titre-panier");
  fenetre.innerHTML =
    '<div class="fenetre-tete"><h2 id="titre-panier">Votre commande</h2><button type="button" class="fermer-panier" aria-label="Fermer">×</button></div>' +
    '<div class="fenetre-corps"><ul class="lignes-panier"></ul><div class="total-panier"></div>' +
    '<form class="form-commande" novalidate>' +
    '<div class="champ"><label for="cmd-nom">Votre nom</label><input id="cmd-nom" autocomplete="name" required><span class="msg-erreur" hidden>Indiquez votre nom.</span></div>' +
    '<fieldset class="choix"><legend>Comment ?</legend>' +
    '<label><input type="radio" name="mode" value="Sur place" checked><span>Sur place</span></label>' +
    '<label><input type="radio" name="mode" value="À emporter"><span>À emporter</span></label></fieldset>' +
    '<div class="champ"><label for="cmd-heure">Pour quelle heure ? (facultatif)</label><input id="cmd-heure" type="time"></div>' +
    '<button class="bouton b-action" type="submit">Envoyer la commande sur WhatsApp</button>' +
    '<button class="b-discret vider" type="button">Vider le panier</button>' +
    "</form></div>";
  document.body.appendChild(fenetre);

  function majPanier() {
    var n = nbArticles();
    barre.hidden = n === 0;
    document.body.classList.toggle("avec-panier", n > 0);
    var t = total();
    barre.querySelector(".barre-panier-texte").textContent =
      n + (n > 1 ? " plats" : " plat") + (t.complet && t.valeur ? " · " + fcfa(t.valeur) : "");

    document.querySelectorAll("[data-zone-quantite]").forEach(function (z) {
      z.innerHTML = htmlQuantite(z.getAttribute("data-zone-quantite"));
    });

    var ul = fenetre.querySelector(".lignes-panier");
    ul.innerHTML = Object.keys(panier).map(function (nom) {
      var p = platParNom(nom) || {};
      var m = montant(p.prix);
      return '<li><div><b>' + echapper(nom) + "</b>" + (m !== null ? "<small>" + fcfa(m * panier[nom]) + "</small>" : "") + "</div>" +
        htmlQuantite(nom) + "</li>";
    }).join("") || '<li class="panier-vide">Votre panier est vide. Ajoutez des plats depuis la carte.</li>';
    fenetre.querySelector(".total-panier").innerHTML = n
      ? (t.complet ? "<span>Total</span><b>" + fcfa(t.valeur) + "</b>" : "<span>Le restaurant vous confirme le prix total sur WhatsApp.</span>")
      : "";
    fenetre.querySelector(".form-commande").hidden = n === 0;
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ajouter],[data-plus],[data-moins]");
    if (!b) return;
    var nom = b.getAttribute("data-ajouter") || b.getAttribute("data-plus") || b.getAttribute("data-moins");
    changerQuantite(nom, b.hasAttribute("data-moins") ? -1 : 1);
    if (b.hasAttribute("data-ajouter")) {
      barre.classList.remove("rebond"); void barre.offsetWidth; barre.classList.add("rebond");
      var zone = document.querySelector('[data-zone-quantite="' + CSS.escape(nom) + '"] [data-plus]');
      if (zone && !fenetre.open) zone.focus();
    }
  });
  barre.querySelector("button").addEventListener("click", function () { if (fenetre.showModal) fenetre.showModal(); });
  fenetre.querySelector(".fermer-panier").addEventListener("click", function () { fenetre.close(); });
  fenetre.addEventListener("click", function (e) { if (e.target === fenetre) fenetre.close(); });
  fenetre.querySelector(".vider").addEventListener("click", function () { panier = {}; stocker("pde-panier", panier); majPanier(); fenetre.close(); });
  fenetre.querySelector(".form-commande").addEventListener("submit", function (e) {
    e.preventDefault();
    var nomClient = fenetre.querySelector("#cmd-nom");
    var bloc = nomClient.closest(".champ");
    var vide = !nomClient.value.trim();
    bloc.classList.toggle("erreur", vide);
    bloc.querySelector(".msg-erreur").hidden = !vide;
    if (vide) { nomClient.focus(); return; }
    var mode = fenetre.querySelector('input[name="mode"]:checked').value;
    var heure = fenetre.querySelector("#cmd-heure").value;
    var t = total();
    var lignes = Object.keys(panier).map(function (nom) { return "• " + panier[nom] + " × " + nom; }).join("\n");
    var texte = "Bonjour Pieds dans l'eau ! Je voudrais commander :\n" + lignes +
      (t.complet && t.valeur ? "\nTotal indiqué sur le site : " + fcfa(t.valeur) : "") +
      "\n\n" + mode + (heure ? ", pour " + heure.replace(":", " h ") : "") +
      "\nNom : " + nomClient.value.trim();
    window.open(lienWhatsApp(texte), "_blank", "noopener");
  });

  /* ---------- La carte ---------- */
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
      ? '<span class="etiquette e-dispo">Disponible</span><div data-zone-quantite="' + echapper(p.nom) + '">' + htmlQuantite(p.nom) + "</div>"
      : '<span class="etiquette e-epuise">Épuisé aujourd\'hui</span>';
    return '<article class="plat revele' + (p.photo ? "" : " sans-photo") + (p.disponible ? "" : " epuise") + '">' +
      '<div class="plat-visuel">' + visuel + "</div>" +
      '<div class="plat-corps"><div class="plat-tete"><h3>' + echapper(p.nom) + "</h3>" +
      (p.prix ? '<span class="prix">' + echapper(p.prix) + "</span>" : "") + "</div>" +
      "<p>" + echapper(p.description) + "</p>" +
      '<div class="plat-pied">' + pied + "</div></div></article>";
  }

  /* ---------- Données : Supabase si configuré, sinon contenu.js ---------- */
  var SB = C.supabaseUrl && C.supabaseCle && C.supabaseUrl.indexOf("supabase.co") > 0;
  // La clé publique suffit dans « apikey » (compatible avec les clés anon et publishable)
  function enTetes() { return { apikey: C.supabaseCle }; }
  function avecDelai(promesse, ms) {
    return Promise.race([promesse, new Promise(function (_, rejet) { setTimeout(function () { rejet(new Error("délai")); }, ms); })]);
  }
  function lireTable(table, requete) {
    return fetch(C.supabaseUrl + "/rest/v1/" + table + "?" + requete, { headers: enTetes() })
      .then(function (r) { if (!r.ok) throw new Error(table + " " + r.status); return r.json(); });
  }
  function chargerDonnees() {
    if (!SB) { rendreDonnees(); return; }
    var demandes = [lireTable("plats", "select=nom,categorie,description,prix,photo,disponible&order=ordre.asc,cree_le.asc")];
    if (document.getElementById("galerie")) demandes.push(lireTable("galerie", "select=type,fichier,legende&order=ordre.asc,cree_le.desc"));
    avecDelai(Promise.all(demandes), 8000).then(function (res) {
      C.carte = res[0];
      if (res[1]) C.galerie = res[1];
    }).catch(function (e) {
      if (window.console) console.warn("Carte en ligne indisponible, version locale affichée :", e.message);
    }).then(rendreDonnees);
  }

  function rendreDonnees() {
  nettoyerPanier();
  var zoneCarte = document.getElementById("carte");
  if (zoneCarte && C.carte) {
    var filtres = document.getElementById("filtres");
    var cles = Object.keys(C.categories);
    var afficher = function (filtre) {
      zoneCarte.classList.remove("apparait"); void zoneCarte.offsetWidth; zoneCarte.classList.add("apparait");
      zoneCarte.innerHTML = cles.filter(function (k) { return filtre === "tout" || filtre === k; }).map(function (k) {
        var plats = C.carte.filter(function (p) { return p.categorie === k; });
        if (!plats.length) return "";
        return '<section class="categorie" aria-labelledby="cat-' + k + '"><h2 id="cat-' + k + '">' + echapper(C.categories[k]) +
          " <small>" + plats.length + " choix</small></h2>" +
          '<div class="grille g2">' + plats.map(htmlPlat).join("") + "</div></section>";
      }).join("");
      observerApparitions(zoneCarte);
    };
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
    observerApparitions(apercu);
  }
  majPanier();

  /* ---------- La galerie ---------- */
  var galerie = document.getElementById("galerie");
  if (galerie) {
    var items = C.galerie || [];
    if (!items.length) {
      document.getElementById("galerie-vide").hidden = false;
    } else {
      galerie.hidden = false;
      galerie.innerHTML = items.map(function (it, i) {
        if (it.type === "video") {
          return '<figure class="revele"><video src="' + echapper(it.fichier) + '" controls preload="metadata" playsinline></video>' +
            '<span class="video-marque">Vidéo</span>' + (it.legende ? "<figcaption>" + echapper(it.legende) + "</figcaption>" : "") + "</figure>";
        }
        return '<figure class="revele"><button type="button" data-i="' + i + '" aria-label="Agrandir : ' + echapper(it.legende || "photo") + '">' +
          '<img src="' + echapper(it.fichier) + '" alt="' + echapper(it.legende || "") + '" loading="lazy"></button>' +
          (it.legende ? "<figcaption>" + echapper(it.legende) + "</figcaption>" : "") + "</figure>";
      }).join("");
      observerApparitions(galerie);
      var vis = document.getElementById("visionneuse");
      var photos = items.map(function (it, i) { return it.type === "video" ? null : i; }).filter(function (i) { return i !== null; });
      var courant = 0;
      var montrer = function (i) {
        courant = i;
        var it = items[i];
        vis.querySelector("img").src = it.fichier;
        vis.querySelector("img").alt = it.legende || "";
        vis.querySelector("p").textContent = it.legende || "";
      };
      galerie.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-i]");
        if (!b || !vis || !vis.showModal) return;
        montrer(+b.getAttribute("data-i"));
        vis.showModal();
      });
      if (vis) {
        var suivant = function (sens) {
          var pos = photos.indexOf(courant);
          montrer(photos[(pos + sens + photos.length) % photos.length]);
        };
        vis.querySelector(".fermer").addEventListener("click", function () { vis.close(); });
        vis.querySelector(".prec").addEventListener("click", function () { suivant(-1); });
        vis.querySelector(".suiv").addEventListener("click", function () { suivant(1); });
        vis.addEventListener("click", function (e) { if (e.target === vis) vis.close(); });
        vis.addEventListener("keydown", function (e) {
          if (e.key === "ArrowRight") suivant(1);
          if (e.key === "ArrowLeft") suivant(-1);
        });
        var x0 = null;
        vis.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
        vis.addEventListener("touchend", function (e) {
          if (x0 === null) return;
          var dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 50) suivant(dx < 0 ? 1 : -1);
          x0 = null;
        });
      }
    }
  }

  }
  chargerDonnees();

  /* ---------- Réservation : enregistrée dans Supabase + message WhatsApp ---------- */
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
        (v("resa-tel") ? "Téléphone : " + v("resa-tel") + "\n" : "") +
        "Date : " + d + (v("resa-heure") ? " vers " + v("resa-heure") : "") + "\n" +
        "Nombre de personnes : " + v("resa-personnes") +
        (v("resa-occasion") ? "\nOccasion : " + v("resa-occasion") : "") +
        (v("resa-message") ? "\nPrécisions : " + v("resa-message") : "");
      // WhatsApp s'ouvre tout de suite (sinon le navigateur bloque la fenêtre)
      window.open(lienWhatsApp(texte), "_blank", "noopener");

      var retour = document.getElementById("resa-retour");
      if (!SB) return;
      fetch(C.supabaseUrl + "/rest/v1/reservations", {
        method: "POST",
        keepalive: true,
        headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, enTetes()),
        body: JSON.stringify({
          nom: v("resa-nom"), telephone: v("resa-tel"), date_resa: v("resa-date"), heure: v("resa-heure"),
          personnes: v("resa-personnes"), occasion: v("resa-occasion"), message: v("resa-message")
        })
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        if (retour) { retour.className = "message m-succes"; retour.textContent = "Votre demande est enregistrée. Envoyez aussi le message WhatsApp qui vient de s'ouvrir : nous vous confirmons rapidement."; retour.hidden = false; }
        form.reset();
      }).catch(function () {
        if (retour) { retour.className = "message m-attention"; retour.textContent = "Votre demande n'a pas pu être enregistrée sur le site. Envoyez le message WhatsApp qui s'est ouvert, ou appelez-nous : nous la noterons."; retour.hidden = false; }
      });
    });
  }
})();
