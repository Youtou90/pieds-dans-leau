/* Pieds dans l'eau : comportements du site (refonte d'octobre 2026).
   En-tête, aperçu des pages au survol, WhatsApp, réservation express, carte et panier,
   fiche d'un plat, galerie, questions, formulaire de réservation. Vanilla JS, sans compilation. */
(function () {
  "use strict";
  var C = window.CONTENU || {};
  var corps = document.body;
  var BASE = corps.getAttribute("data-base") || "";
  var PAGE = corps.getAttribute("data-page") || "";
  var MESSAGE_PAGE = corps.getAttribute("data-message") || "Bonjour Pieds dans l’eau !";
  var survolPossible = window.matchMedia("(hover: hover) and (min-width: 1040px)");
  var mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  /* ---------- Outils ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function echapper(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sansAccents(t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function lienWhatsApp(message) { return "https://wa.me/" + C.whatsapp + (message ? "?text=" + encodeURIComponent(message) : ""); }
  function chemin(p) { return /^(https?:)?\/\//.test(p) ? p : BASE + p; }
  function lire(cle, defaut) { try { var v = JSON.parse(localStorage.getItem(cle)); return v == null ? defaut : v; } catch (e) { return defaut; } }
  function stocker(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) {} }
  function montant(prix) { var n = parseInt(String(prix || "").replace(/[^\d]/g, ""), 10); return isNaN(n) ? null : n; }
  // Prix selon la charte : espace fine entre milliers, devise après le prix (5 000 FCFA)
  function milliers(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f"); }
  function fcfa(n) { return milliers(n) + "\u00a0FCFA"; }
  function prixHTML(prix) {
    var m = montant(prix);
    return m === null ? echapper(prix) : milliers(m) + "\u00a0<small>FCFA</small>";
  }
  var I_WA = '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>';
  var I_FLECHE = '<svg class="ico fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  /* ---------- Liens WhatsApp (data-wa : message propre au lien, sinon celui de la page) ---------- */
  function majLiensWhatsApp(racine) {
    $$("[data-wa]", racine).forEach(function (a) {
      a.href = lienWhatsApp(a.getAttribute("data-wa") || MESSAGE_PAGE);
    });
  }
  majLiensWhatsApp();

  /* ---------- Année, ouvert maintenant ---------- */
  $$("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  var heures = C.ouverture || { debut: 8, fin: 24 };
  function etatOuverture() {
    var d = new Date();
    var h = (d.getUTCHours() + 1 + d.getUTCMinutes() / 60) % 24;   // Bertoua : UTC+1
    if (h >= heures.debut && h < heures.fin) return { ouvert: true, texte: heures.fin - h <= 1 ? "Ouvert, ferme bientôt" : "Ouvert maintenant" };
    return { ouvert: false, texte: "Fermé, ouvre à " + String(heures.debut).padStart(2, "0") + " h" };
  }
  function majOuverture() {
    var e = etatOuverture();
    $$("[data-ouverture]").forEach(function (el) {
      el.textContent = e.texte;
      el.classList.toggle("est-ouvert", e.ouvert);
      el.classList.toggle("est-ferme", !e.ouvert);
    });
  }
  majOuverture();
  setInterval(majOuverture, 60000);

  /* ---------- Apparitions (pdlUp) ---------- */
  var observateur = ("IntersectionObserver" in window && !mouvementReduit) ? new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); observateur.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: .06 }) : null;
  function observer(racine) {
    $$(".monte:not(.vu)", racine).forEach(function (el) { if (observateur) observateur.observe(el); else el.classList.add("vu"); });
  }
  observer();

  /* ---------- En-tête : ombre au défilement ---------- */
  var entete = $("#entete");
  function ombre() { if (entete) entete.classList.toggle("defile", window.scrollY > 8); }
  window.addEventListener("scroll", ombre, { passive: true });
  ombre();

  /* ---------- Menu mobile ---------- */
  var boutonMenu = $(".nav-bouton");
  var menuMobile = $("#menu-mobile");
  if (boutonMenu && menuMobile) {
    boutonMenu.addEventListener("click", function () {
      var ouvert = menuMobile.classList.toggle("ouvert");
      boutonMenu.setAttribute("aria-expanded", ouvert ? "true" : "false");
      boutonMenu.querySelector("span").textContent = ouvert ? "Fermer" : "Menu";
      document.documentElement.style.overflow = ouvert ? "hidden" : "";
    });
  }

  /* ---------- Aperçu des pages au survol du menu ---------- */
  function pages() {
    return {
      "index.html": { photo: "photos/lieu/lac-coucher.jpg", surtitre: "Accueil", titre: "Pieds dans l’eau, cœur au chaud.", texte: "Le restaurant en plein air au bord du lac, au Camp-SIC. Réservez votre table en 10 secondes.", tags: ["Au bord du lac", "Ouvert 7 j/7"] },
      "carte.html": { photo: "photos/plats/ndole.jpg", surtitre: "La carte", titre: "Les plats du pays", texte: "Ekwang, koki chaud, ndolè aux crevettes, taro sauce jaune. Ajoutez au panier, commandez sur WhatsApp.", tags: ["4 plats", "Sur place ou à emporter"] },
      "activites.html": { photo: "photos/lieu/lac-pirogue.jpg", surtitre: "Activités", titre: "Plus qu’un repas", texte: "La balade en pirogue, les anniversaires au bord de l’eau, les repas d’équipe au calme.", tags: ["Pirogue", "Anniversaires", "Entreprises"] },
      "galerie.html": { photo: "photos/lieu/soir-terrasse.jpg", surtitre: "Galerie", titre: "Le lac en images", texte: "Le lac au coucher du soleil, la terrasse sur pilotis et ses lumières le soir.", tags: ["Le lac", "La terrasse", "Le soir"] },
      "questions.html": { photo: "photos/lieu/terrasse.jpg", surtitre: "Questions", titre: "Vos questions, nos réponses", texte: "Horaires, accès, réservation, pirogue, anniversaires : l’essentiel avant de venir.", tags: ["Horaires", "Accès", "Réservation"] },
      "a-propos.html": { photo: "photos/lieu/terrasse-jour.jpg", surtitre: "Le lieu", titre: "Une terrasse au bord de l’eau", texte: "On retire ses chaussures, on garde les pieds au frais pendant le repas. Le temps ralentit.", tags: ["Camp-SIC", "Nkolbikon"] },
      "contact.html": { photo: "photos/lieu/entree.jpg", surtitre: "Contact", titre: "Réserver, venir, nous écrire", texte: (C.horaires || "") + ". " + (C.adresse || "") + ".", tags: [etatOuverture().texte, "WhatsApp"] }
    };
  }
  var apercu = $("#apercu");
  if (apercu) {
    var minuteurFermer, minuteurOuvrir, ouvertSur = null;
    var donnees = pages();
    var fermerApercu = function () {
      ouvertSur = null;
      apercu.classList.remove("ouvert");
      apercu.setAttribute("aria-hidden", "true");
      $$(".nav ul a").forEach(function (a) { a.classList.remove("survole"); });
    };
    var ouvrirApercu = function (lien) {
      var cle = lien.getAttribute("data-page");
      var d = donnees[cle];
      if (!d || cle === PAGE) { fermerApercu(); return; }
      clearTimeout(minuteurFermer);
      if (ouvertSur === cle) return;
      ouvertSur = cle;
      $$(".nav ul a").forEach(function (a) { a.classList.toggle("survole", a === lien); });
      apercu.innerHTML = '<div class="apercu-carte"><div class="apercu-photo"><img class="washed" src="' + chemin(d.photo) + '" alt=""></div>' +
        '<div class="apercu-texte"><span class="surtitre">' + echapper(d.surtitre) + "</span><h2>" + echapper(d.titre) + "</h2><p>" + echapper(d.texte) + "</p>" +
        '<div class="etiquettes">' + d.tags.map(function (t) { return '<span class="etiquette">' + echapper(t) + "</span>"; }).join("") + "</div>" +
        '<a class="bouton b-accent b-petit" href="' + lien.getAttribute("href") + '">Découvrir la page ' + I_FLECHE + "</a></div></div>";
      apercu.setAttribute("aria-hidden", "false");
      apercu.classList.remove("ouvert"); void apercu.offsetWidth; apercu.classList.add("ouvert");
    };
    var fermerBientot = function () { clearTimeout(minuteurOuvrir); minuteurFermer = setTimeout(fermerApercu, 200); };
    $$(".nav ul a").forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        if (!survolPossible.matches) return;
        clearTimeout(minuteurOuvrir);
        minuteurOuvrir = setTimeout(function () { ouvrirApercu(a); }, ouvertSur ? 0 : 80);
      });
      a.addEventListener("mouseleave", fermerBientot);
      a.addEventListener("focus", function () { if (survolPossible.matches) ouvrirApercu(a); });
    });
    apercu.addEventListener("mouseenter", function () { clearTimeout(minuteurFermer); });
    apercu.addEventListener("mouseleave", fermerBientot);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fermerApercu(); });
    document.addEventListener("focusin", function (e) { if (ouvertSur && !entete.contains(e.target)) fermerApercu(); });
  }

  /* ---------- Réservez en 10 secondes (accueil) ---------- */
  var resa10 = $("#resa10");
  if (resa10) {
    var nb = 2;
    var choix = function (groupe) { var b = $('[data-groupe="' + groupe + '"] [aria-pressed="true"]', resa10); return b ? b.textContent : ""; };
    var majResa10 = function () {
      var moment = choix("moment"), repas = choix("repas").toLowerCase();
      var texte = "Bonjour Pieds dans l’eau ! Je voudrais réserver une table pour " + nb + (nb > 1 ? " personnes" : " personne") +
        ", " + moment.toLowerCase() + ", pour le " + repas + ". Merci de me confirmer.";
      $("#resa10-message").textContent = "« " + texte + " »";
      $("#resa10-envoyer").href = lienWhatsApp(texte);
      $("#resa10-n").textContent = nb;
    };
    $$(".puces", resa10).forEach(function (groupe) {
      groupe.addEventListener("click", function (e) {
        var b = e.target.closest(".puce");
        if (!b) return;
        $$(".puce", groupe).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        // Ce soir => dîner, ce midi => déjeuner
        if (b.textContent === "Ce soir" || b.textContent === "Ce midi") {
          var cible = b.textContent === "Ce soir" ? "Dîner" : "Déjeuner";
          $$('[data-groupe="repas"] .puce', resa10).forEach(function (x) { x.setAttribute("aria-pressed", x.textContent === cible ? "true" : "false"); });
        }
        majResa10();
      });
    });
    $$("[data-delta]", resa10).forEach(function (b) {
      b.addEventListener("click", function () { nb = Math.min(60, Math.max(1, nb + parseInt(b.getAttribute("data-delta"), 10))); majResa10(); });
    });
    majResa10();
  }

  /* ---------- Données : Supabase, sinon contenu.js ---------- */
  var SB = !/[?&]local\b/.test(location.search) && C.supabaseUrl && C.supabaseCle;
  function lireTable(table, requete) {
    return fetch(C.supabaseUrl + "/rest/v1/" + table + "?" + requete, { headers: { apikey: C.supabaseCle } })
      .then(function (r) { if (!r.ok) throw new Error(table + " " + r.status); return r.json(); });
  }
  function avecDelai(p, ms) { return Promise.race([p, new Promise(function (_, n) { setTimeout(function () { n(new Error("délai")); }, ms); })]); }
  function chargerDonnees() {
    if (!SB) return Promise.resolve();
    var besoinGalerie = !!$("#galerie");
    var plats = lireTable("plats", "select=nom,categorie,description,prix,photo,disponible&order=ordre.asc,cree_le.asc");
    var galerie = besoinGalerie
      ? lireTable("galerie", "select=type,fichier,legende,theme&order=ordre.asc,cree_le.desc")
          .catch(function () { return lireTable("galerie", "select=type,fichier,legende&order=ordre.asc,cree_le.desc"); })
      : Promise.resolve(null);
    return avecDelai(Promise.all([plats, galerie]), 8000).then(function (r) {
      if (r[0] && r[0].length) C.carte = r[0];
      if (r[1] && r[1].length) C.galerie = r[1];
    }).catch(function (e) { if (window.console) console.warn("Base indisponible, données locales :", e.message); });
  }

  /* ---------- Plats : fiche (page dédiée, photos) ---------- */
  function ficheDe(p) {
    var cles = Object.keys(C.fiches || {});
    for (var i = 0; i < cles.length; i++) {
      if (sansAccents(C.fiches[cles[i]].nom) === sansAccents(p.nom)) return { id: cles[i], photos: C.fiches[cles[i]].photos };
    }
    return { id: null, photos: p.photo ? [p.photo] : [] };
  }
  function photosDe(p) {
    var f = ficheDe(p);
    var liste = f.photos.slice();
    if (p.photo && liste.indexOf(p.photo) < 0) liste.unshift(p.photo);
    return liste;
  }
  function lienPagePlat(p) { var f = ficheDe(p); return f.id ? (C.siteUrl || "") + "/plats/" + f.id + ".html" : ""; }
  function messagePlat(p, q) {
    var lien = lienPagePlat(p);
    return "Bonjour Pieds dans l’eau ! Je voudrais commander : " + (q > 1 ? q + " × " : "") + p.nom + "." + (lien ? "\n" + lien : "");
  }

  /* ---------- Panier ---------- */
  var panier = lire("pdl-panier", {});
  function plat(nom) { return (C.carte || []).filter(function (p) { return p.nom === nom; })[0]; }
  function nettoyer() { Object.keys(panier).forEach(function (n) { var p = plat(n); if (!p || !p.disponible || panier[n] < 1) delete panier[n]; }); }
  function nbArticles() { return Object.keys(panier).reduce(function (s, k) { return s + panier[k]; }, 0); }
  function total() {
    var t = 0, complet = true;
    Object.keys(panier).forEach(function (n) { var m = montant((plat(n) || {}).prix); if (m === null) complet = false; else t += m * panier[n]; });
    return { valeur: t, complet: complet };
  }
  function changer(nom, delta) {
    panier[nom] = Math.max(0, (panier[nom] || 0) + delta);
    if (!panier[nom]) delete panier[nom];
    stocker("pdl-panier", panier);
    majPanier();
  }
  function htmlQuantite(nom) {
    var q = panier[nom] || 0, n = echapper(nom);
    if (!q) return '<button class="ajouter" type="button" data-ajouter="' + n + '">+ Ajouter</button>';
    return '<div class="quantite" role="group" aria-label="Quantité de ' + n + '"><button type="button" data-moins="' + n + '" aria-label="Retirer un ' + n + '">−</button>' +
      '<output aria-live="polite">' + q + '</output><button type="button" data-plus="' + n + '" aria-label="Ajouter un ' + n + '">+</button></div>';
  }

  var barre = document.createElement("div");
  barre.className = "barre-panier";
  barre.hidden = true;
  barre.innerHTML = '<button type="button" aria-haspopup="dialog"><span class="barre-texte"></span><span class="voir">Voir la commande ' + I_FLECHE + "</span></button>";
  corps.appendChild(barre);

  var volet = document.createElement("dialog");
  volet.className = "volet";
  volet.setAttribute("aria-labelledby", "titre-volet");
  volet.innerHTML = '<div class="volet-interieur"><div class="volet-tete"><h2 id="titre-volet">Votre commande</h2><button type="button" class="fermer" data-fermer aria-label="Fermer">×</button></div>' +
    '<div class="volet-corps"><ul class="lignes-panier"></ul><div class="volet-total"></div>' +
    '<div class="segment" role="radiogroup" aria-label="Sur place ou à emporter"><label><input type="radio" name="mode" value="Sur place" checked><span>Sur place</span></label><label><input type="radio" name="mode" value="À emporter"><span>À emporter</span></label></div>' +
    '<div class="champ"><label for="cmd-nom">Votre nom <small>(facultatif)</small></label><input id="cmd-nom" autocomplete="name"></div></div>' +
    '<div class="volet-pied"><a class="bouton b-accent" id="cmd-envoyer" target="_blank" rel="noopener" href="#">' + I_WA + "Envoyer la commande sur WhatsApp</a>" +
    '<button type="button" class="b-lien" id="cmd-vider">Vider le panier</button></div></div>';
  corps.appendChild(volet);

  function messageCommande() {
    var lignes = Object.keys(panier).map(function (n) { return "• " + panier[n] + " × " + n; }).join("\n");
    var liens = Object.keys(panier).map(function (n) { var p = plat(n); return p ? lienPagePlat(p) : ""; }).filter(Boolean);
    var t = total();
    var mode = (volet.querySelector('input[name="mode"]:checked') || {}).value || "Sur place";
    var nom = $("#cmd-nom", volet).value.trim();
    return "Bonjour Pieds dans l’eau ! Je voudrais commander :\n" + lignes +
      (t.complet && t.valeur ? "\nTotal indiqué sur le site : " + fcfa(t.valeur) : "") +
      "\n\n" + mode + (nom ? "\nNom : " + nom : "") + (liens.length ? "\n\n" + liens.join("\n") : "");
  }
  function majEnvoi() { $("#cmd-envoyer", volet).href = lienWhatsApp(messageCommande()); }
  function majPanier() {
    var n = nbArticles();
    barre.hidden = n === 0;
    corps.classList.toggle("avec-panier", n > 0);
    var t = total();
    barre.querySelector(".barre-texte").textContent = n + (n > 1 ? " plats dans le panier" : " plat dans le panier") + (t.complet && t.valeur ? " · " + fcfa(t.valeur) : "");
    $$("[data-zone-quantite]").forEach(function (z) { z.innerHTML = htmlQuantite(z.getAttribute("data-zone-quantite")); });
    $(".lignes-panier", volet).innerHTML = Object.keys(panier).map(function (nom) {
      var p = plat(nom) || {}, ph = photosDe(p)[0];
      return "<li>" + (ph ? '<img class="washed" src="' + chemin(ph) + '" alt="">' : "<span></span>") +
        "<div><b>" + echapper(nom) + "</b>" + (montant(p.prix) !== null ? '<div class="prix">' + fcfa(montant(p.prix) * panier[nom]) + "</div>" : "") + "</div>" + htmlQuantite(nom) + "</li>";
    }).join("") || '<li class="panier-vide" style="display:block">Votre panier est vide.</li>';
    $(".volet-total", volet).innerHTML = n ? (t.complet && t.valeur ? "<b>Total : " + fcfa(t.valeur) + "</b>" : '<p class="mention">Le restaurant vous confirme le prix total sur WhatsApp.</p>') : "";
    $(".volet-pied", volet).hidden = n === 0;
    majEnvoi();
  }
  volet.addEventListener("input", majEnvoi);
  volet.addEventListener("change", majEnvoi);
  barre.querySelector("button").addEventListener("click", function () { if (volet.showModal) volet.showModal(); });
  volet.addEventListener("click", function (e) { if (e.target === volet || e.target.closest("[data-fermer]")) volet.close(); });
  $("#cmd-vider", volet).addEventListener("click", function () { panier = {}; stocker("pdl-panier", panier); majPanier(); volet.close(); });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ajouter],[data-plus],[data-moins]");
    if (!b) return;
    var nom = b.getAttribute("data-ajouter") || b.getAttribute("data-plus") || b.getAttribute("data-moins");
    changer(nom, b.hasAttribute("data-moins") ? -1 : 1);
    if (b.hasAttribute("data-ajouter")) { barre.classList.remove("rebond"); void barre.offsetWidth; barre.classList.add("rebond"); }
  });

  /* ---------- Fiche d'un plat (clic sur la photo) ---------- */
  var fiche = document.createElement("dialog");
  fiche.className = "fiche";
  fiche.setAttribute("aria-labelledby", "fiche-titre");
  corps.appendChild(fiche);
  var qFiche = 1, platFiche = null;
  function ouvrirFiche(p) {
    platFiche = p; qFiche = 1;
    var ph = photosDe(p);
    fiche.innerHTML = '<div class="fiche-grille"><div class="fiche-photos"><div class="grande"><img class="washed" src="' + chemin(ph[0] || "") + '" alt="' + echapper(p.nom) + '"></div>' +
      (ph.length > 1 ? '<div class="miniatures">' + ph.map(function (x, i) { return '<button type="button" data-photo="' + echapper(chemin(x)) + '" aria-pressed="' + (i === 0) + '" aria-label="Photo ' + (i + 1) + '"><img src="' + chemin(x) + '" alt=""></button>'; }).join("") + "</div>" : "") +
      '</div><div class="fiche-texte"><button type="button" class="fermer" data-fermer aria-label="Fermer">×</button><span class="surtitre">' + echapper((C.categories || {})[p.categorie] || "À la carte") + "</span>" +
      '<h2 id="fiche-titre">' + echapper(p.nom) + "</h2>" + (p.prix ? '<span class="prix">' + prixHTML(p.prix) + "</span>" : "") + '<p class="chapeau" style="font-size:17px">' + echapper(p.description) + "</p>" +
      (p.disponible
        ? '<div class="choix-groupe"><span>Quantité</span><div class="compteur"><button type="button" data-q="-1" aria-label="Un de moins">−</button><output id="fiche-q">1</output><button type="button" data-q="1" aria-label="Un de plus">+</button></div></div>' +
          '<a class="bouton b-accent" id="fiche-wa" target="_blank" rel="noopener" href="' + lienWhatsApp(messagePlat(p, 1)) + '">' + I_WA + "Commander ce plat sur WhatsApp</a>" +
          '<button type="button" class="bouton b-contour" id="fiche-panier">Ajouter au panier et continuer</button>'
        : '<span class="badge-epuise">Épuisé aujourd’hui</span>') +
      "</div></div>";
    if (fiche.showModal) fiche.showModal();
  }
  fiche.addEventListener("click", function (e) {
    if (e.target === fiche || e.target.closest("[data-fermer]")) { fiche.close(); return; }
    var m = e.target.closest("[data-photo]");
    if (m) { $(".grande img", fiche).src = m.getAttribute("data-photo"); $$("[data-photo]", fiche).forEach(function (x) { x.setAttribute("aria-pressed", x === m ? "true" : "false"); }); return; }
    var d = e.target.closest("[data-q]");
    if (d) { qFiche = Math.min(30, Math.max(1, qFiche + parseInt(d.getAttribute("data-q"), 10))); $("#fiche-q", fiche).textContent = qFiche; $("#fiche-wa", fiche).href = lienWhatsApp(messagePlat(platFiche, qFiche)); return; }
    if (e.target.closest("#fiche-panier")) { changer(platFiche.nom, qFiche); fiche.close(); barre.classList.remove("rebond"); void barre.offsetWidth; barre.classList.add("rebond"); }
  });

  /* ---------- Cartes de plats ---------- */
  function htmlPlat(p, i) {
    var ph = photosDe(p);
    var lienWa = '<a class="lien-wa-plat" target="_blank" rel="noopener" href="' + lienWhatsApp(messagePlat(p, 1)) + '">' + I_WA + "Commander</a>";
    return '<article class="plat monte' + (p.disponible ? "" : " epuise") + '" style="--i:' + i + '">' +
      '<button type="button" class="plat-photo" data-fiche="' + echapper(p.nom) + '" aria-label="Voir ' + echapper(p.nom) + ' en grand">' +
      (ph[0] ? '<img class="washed" src="' + chemin(ph[0]) + '" alt="' + echapper(p.nom) + '" loading="lazy">' : "") +
      (ph[1] ? '<img class="washed photo-2" src="' + chemin(ph[1]) + '" alt="" loading="lazy">' : "") +
      '<span class="loupe">Voir en grand</span></button>' +
      '<div class="plat-corps"><div class="plat-tete"><h3>' + echapper(p.nom) + "</h3>" + (p.prix ? '<span class="prix">' + prixHTML(p.prix) + "</span>" : "") + "</div>" +
      "<p>" + echapper(p.description) + "</p>" +
      '<div class="plat-pied">' + (p.disponible ? '<div data-zone-quantite="' + echapper(p.nom) + '">' + htmlQuantite(p.nom) + "</div>" + lienWa : '<span class="badge-epuise">Épuisé aujourd’hui</span>') + "</div></div></article>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fiche]");
    if (!b) return;
    var p = plat(b.getAttribute("data-fiche"));
    if (p) ouvrirFiche(p);
  });
  function rendreCarte() {
    var zones = [$("#carte"), $("#apercu-carte")];
    zones.forEach(function (z, k) {
      if (!z) return;
      var liste = (C.carte || []).slice();
      if (k === 1) liste = liste.filter(function (p) { return p.disponible; }).slice(0, 4);
      z.innerHTML = liste.map(htmlPlat).join("") || '<p class="vide">La carte du jour arrive bientôt.</p>';
      observer(z);
    });
  }

  /* ---------- Galerie ---------- */
  function rendreGalerie() {
    var zone = $("#galerie");
    if (!zone) return;
    var tout = C.galerie || [];
    var filtre = "tout";
    var visibles = [];
    var vis = $("#visionneuse"), courant = 0;
    var afficher = function () {
      visibles = tout.filter(function (g) { return filtre === "tout" || g.theme === filtre; });
      $("#galerie-vide").hidden = visibles.length > 0;
      zone.innerHTML = visibles.map(function (g, i) {
        if (g.type === "video") return '<figure style="--i:' + i + '"><video src="' + chemin(g.fichier) + '" controls preload="metadata" playsinline></video>' + (g.legende ? "<figcaption>" + echapper(g.legende) + "</figcaption>" : "") + "</figure>";
        return '<figure style="--i:' + i + '"><button type="button" data-i="' + i + '" aria-label="Agrandir : ' + echapper(g.legende || "photo") + '"><img class="washed" src="' + chemin(g.fichier) + '" alt="' + echapper(g.legende) + '" loading="lazy"></button>' +
          (g.legende ? "<figcaption>" + echapper(g.legende) + "</figcaption>" : "") + "</figure>";
      }).join("");
    };
    var montrer = function (i) {
      var photos = visibles.filter(function (g) { return g.type !== "video"; });
      if (!photos.length) return;
      courant = (i + photos.length) % photos.length;
      $("img", vis).src = chemin(photos[courant].fichier);
      $("img", vis).alt = photos[courant].legende || "";
      $("figcaption", vis).textContent = photos[courant].legende || "";
    };
    $("#filtres-galerie").addEventListener("click", function (e) {
      var b = e.target.closest(".puce");
      if (!b) return;
      filtre = b.getAttribute("data-theme");
      $$(".puce", this).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      afficher();
    });
    zone.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]");
      if (!b || !vis.showModal) return;
      var g = visibles[+b.getAttribute("data-i")];
      var photos = visibles.filter(function (x) { return x.type !== "video"; });
      montrer(photos.indexOf(g));
      vis.showModal();
    });
    $(".fermer", vis).addEventListener("click", function () { vis.close(); });
    $(".prec", vis).addEventListener("click", function () { montrer(courant - 1); });
    $(".suiv", vis).addEventListener("click", function () { montrer(courant + 1); });
    vis.addEventListener("click", function (e) { if (e.target === vis) vis.close(); });
    vis.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") montrer(courant + 1); if (e.key === "ArrowLeft") montrer(courant - 1); });
    var x0 = null;
    vis.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    vis.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) montrer(courant + (dx < 0 ? 1 : -1)); x0 = null; });
    afficher();
  }

  /* ---------- Questions : recherche sans accents, réponses dépliables ---------- */
  var faq = $("#faq");
  if (faq) {
    faq.addEventListener("click", function (e) {
      var b = e.target.closest(".question > button");
      if (!b) return;
      var q = b.parentNode, ouverte = !q.classList.contains("ouverte");
      q.classList.toggle("ouverte", ouverte);
      b.setAttribute("aria-expanded", ouverte ? "true" : "false");
    });
    $("#recherche-faq").addEventListener("input", function () {
      var mots = sansAccents(this.value).split(/\s+/).filter(Boolean);
      var nbVisibles = 0;
      $$(".question", faq).forEach(function (q) {
        var texte = sansAccents(q.textContent);
        var ok = mots.every(function (m) { return texte.indexOf(m) >= 0; });
        q.hidden = !ok;
        if (ok) nbVisibles++;
      });
      $("#faq-aucune").hidden = nbVisibles > 0;
    });
  }

  /* ---------- Formulaire de réservation (contact) ---------- */
  var form = $("#form-resa");
  if (form) {
    var date = $("#resa-date", form);
    date.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    var v = function (id) { var el = $("#" + id, form); return el ? el.value.trim() : ""; };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var premier = null;
      $$("[required]", form).forEach(function (champ) {
        var bloc = champ.closest(".champ");
        var vide = !champ.value.trim();
        bloc.classList.toggle("erreur", vide);
        $(".msg-erreur", bloc).hidden = !vide;
        if (vide && !premier) premier = champ;
      });
      if (premier) {
        form.classList.remove("secousse"); void form.offsetWidth; form.classList.add("secousse");
        premier.focus();
        return;
      }
      var jour = new Date(v("resa-date") + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      var texte = "Bonjour Pieds dans l’eau ! Je souhaite réserver une table.\nNom : " + v("resa-nom") + "\nTéléphone : " + v("resa-tel") +
        "\nDate : " + jour + (v("resa-heure") ? " vers " + v("resa-heure") : "") + "\nNombre de personnes : " + v("resa-personnes") +
        (v("resa-occasion") ? "\nOccasion : " + v("resa-occasion") : "") + (v("resa-message") ? "\nPrécisions : " + v("resa-message") : "");
      // La fenêtre WhatsApp est ouverte tout de suite (sinon le navigateur la bloque), puis remplie après l'enregistrement.
      var fenetre = window.open("", "_blank");
      var bouton = $('button[type="submit"]', form);
      bouton.disabled = true;
      var alerte = $("#resa-alerte");
      alerte.hidden = true;
      var enregistrement = !SB ? Promise.resolve(true) : fetch(C.supabaseUrl + "/rest/v1/reservations", {
        method: "POST",
        headers: { apikey: C.supabaseCle, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ nom: v("resa-nom"), telephone: v("resa-tel"), date_resa: v("resa-date"), heure: v("resa-heure"), personnes: v("resa-personnes"), occasion: v("resa-occasion"), message: v("resa-message") })
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
      enregistrement.then(function (ok) {
        var url = lienWhatsApp(texte);
        if (fenetre) fenetre.location.href = url; else window.location.href = url;
        bouton.disabled = false;
        if (ok) {
          form.hidden = true;
          var conf = $("#resa-confirmation");
          conf.hidden = false;
          conf.focus();
        } else {
          alerte.textContent = "Votre demande n’a pas pu être enregistrée sur le site. Envoyez le message WhatsApp qui s’est ouvert, ou appelez-nous : nous la noterons.";
          alerte.hidden = false;
        }
      });
    });
    $("#resa-nouvelle").addEventListener("click", function () { form.reset(); form.hidden = false; $("#resa-confirmation").hidden = true; $("#resa-nom", form).focus(); });
  }

  /* ---------- Démarrage ---------- */
  chargerDonnees().then(function () {
    nettoyer();
    rendreCarte();
    rendreGalerie();
    majPanier();
  });
})();
