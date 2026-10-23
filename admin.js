/* Pieds dans l'eau : espace de gestion (carte, galerie, réservations) relié à Supabase. */
(function () {
  var C = window.CONTENU || {};
  var $ = function (s) { return document.querySelector(s); };
  var vues = { config: $("#vue-config"), connexion: $("#vue-connexion"), gestion: $("#vue-gestion") };
  function montrer(nom) { Object.keys(vues).forEach(function (k) { vues[k].hidden = k !== nom; }); $("#deconnexion").hidden = nom !== "gestion"; }

  if (!C.supabaseUrl || !C.supabaseCle || !window.supabase) { montrer("config"); return; }
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseCle);

  var CATEGORIES = C.categories || { grillades: "Grillades", poissons: "Poissons du lac", pays: "Plats du pays", boissons: "Boissons" };
  function echapper(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  var minuteur;
  function annoncer(texte, erreur) {
    var a = $("#annonce");
    a.textContent = texte;
    a.classList.toggle("erreur", !!erreur);
    a.hidden = false;
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { a.hidden = true; }, erreur ? 6000 : 2800);
  }
  function aujourdhui() { return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function dateLisible(iso) {
    return new Date(iso + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
  function numeroWhatsApp(tel) {
    var n = String(tel || "").replace(/[^\d]/g, "");
    if (n.indexOf("00") === 0) n = n.slice(2);
    if (n.length === 9) n = "237" + n;   // numéro camerounais saisi sans indicatif
    return n;
  }

  /* ---------- Connexion ---------- */
  async function verifierSession() {
    var res = await sb.auth.getSession();
    if (!res.data.session) { montrer("connexion"); return; }
    var admin = await sb.rpc("est_admin");
    if (admin.error || admin.data !== true) {
      await sb.auth.signOut();
      montrer("connexion");
      var err = $("#cx-erreur");
      err.textContent = "Ce compte n’est pas autorisé à gérer le site. Demandez à être ajouté à la liste des admins.";
      err.hidden = false;
      return;
    }
    montrer("gestion");
    chargerReservations();
    chargerPlats();
    chargerGalerie();
  }

  $("#form-connexion").addEventListener("submit", async function (e) {
    e.preventDefault();
    var err = $("#cx-erreur");
    err.hidden = true;
    var bouton = this.querySelector("button");
    bouton.disabled = true; bouton.textContent = "Connexion…";
    var res = await sb.auth.signInWithPassword({ email: $("#cx-email").value.trim(), password: $("#cx-mdp").value });
    bouton.disabled = false; bouton.textContent = "Se connecter";
    if (res.error) {
      err.textContent = "Email ou mot de passe incorrect.";
      err.hidden = false;
      return;
    }
    $("#cx-mdp").value = "";
    verifierSession();
  });
  $("#deconnexion").addEventListener("click", async function () { await sb.auth.signOut(); montrer("connexion"); });

  /* ---------- Onglets ---------- */
  var onglets = document.querySelectorAll('[role="tab"]');
  onglets.forEach(function (t) {
    t.addEventListener("click", function () {
      onglets.forEach(function (x) {
        var actif = x === t;
        x.setAttribute("aria-selected", actif ? "true" : "false");
        document.getElementById(x.getAttribute("aria-controls")).hidden = !actif;
      });
    });
  });

  /* ---------- Réservations ---------- */
  var reservations = [];
  var filtreResa = "a_confirmer";
  async function chargerReservations() {
    var res = await sb.from("reservations").select("*").order("date_resa", { ascending: true }).order("cree_le", { ascending: true });
    if (res.error) { annoncer("Impossible de charger les réservations.", true); return; }
    reservations = res.data;
    afficherReservations();
  }
  function afficherReservations() {
    var jour = aujourdhui();
    var aVenir = function (r) { return r.date_resa >= jour; };
    var nb = reservations.filter(function (r) { return r.statut === "a_confirmer" && aVenir(r); }).length;
    var pastille = $("#compte-resa");
    pastille.hidden = nb === 0;
    pastille.textContent = nb;

    var liste = reservations.filter(function (r) {
      if (filtreResa === "passees") return !aVenir(r);
      return aVenir(r) && r.statut === filtreResa;
    });
    if (filtreResa === "passees") liste.reverse();
    var zone = $("#liste-resa");
    if (!liste.length) {
      zone.innerHTML = '<p class="vide-admin">' + ({ a_confirmer: "Aucune réservation à confirmer pour le moment.", confirmee: "Aucune réservation confirmée à venir.", annulee: "Aucune réservation annulée à venir.", passees: "Aucune réservation passée." })[filtreResa] + "</p>";
      return;
    }
    zone.innerHTML = liste.map(function (r) {
      var wa = numeroWhatsApp(r.telephone);
      var msgConfirm = "Bonjour " + r.nom + ", votre réservation chez Pieds dans l’eau pour " + dateLisible(r.date_resa) +
        (r.heure ? " vers " + r.heure : "") + " (" + r.personnes + " pers.) est confirmée. À bientôt au bord du lac !";
      var actions = "";
      if (r.statut !== "confirmee") actions += '<button class="bouton b-action" type="button" data-statut="confirmee" data-id="' + r.id + '">Confirmer</button>';
      if (r.statut !== "annulee") actions += '<button class="bouton b-second" type="button" data-statut="annulee" data-id="' + r.id + '">Annuler</button>';
      if (r.statut !== "a_confirmer") actions += '<button class="b-discret" type="button" data-statut="a_confirmer" data-id="' + r.id + '">Remettre à confirmer</button>';
      if (wa) actions += '<a class="b-discret" target="_blank" rel="noopener" href="https://wa.me/' + wa + "?text=" + encodeURIComponent(msgConfirm) + '">Répondre sur WhatsApp</a>';
      if (r.telephone) actions += '<a class="b-discret" href="tel:' + echapper(r.telephone.replace(/\s/g, "")) + '">Appeler</a>';
      actions += '<button class="b-discret danger" type="button" data-supprimer-resa="' + r.id + '">Supprimer</button>';
      return '<article class="resa ' + r.statut + '">' +
        '<div class="resa-tete"><h2>' + echapper(r.nom) + '</h2><span class="resa-quand">' + echapper(dateLisible(r.date_resa)) + (r.heure ? " · " + echapper(r.heure) : "") + "</span></div>" +
        '<div class="resa-details"><span><b>' + echapper(r.personnes) + "</b> pers.</span>" +
        (r.occasion ? "<span>" + echapper(r.occasion) + "</span>" : "") +
        "<span>" + echapper(r.telephone) + "</span></div>" +
        (r.message ? '<p class="resa-message">' + echapper(r.message) + "</p>" : "") +
        '<div class="resa-actions">' + actions + "</div>" +
        '<span class="resa-recu">Reçue le ' + new Date(r.cree_le).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + "</span></article>";
    }).join("");
  }
  $("#filtres-resa").addEventListener("click", function (e) {
    var b = e.target.closest(".filtre");
    if (!b) return;
    filtreResa = b.getAttribute("data-f");
    this.querySelectorAll(".filtre").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    afficherReservations();
  });
  $("#actualiser-resa").addEventListener("click", function () { chargerReservations().then(function () { annoncer("Liste à jour."); }); });
  $("#liste-resa").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-statut]");
    if (b) {
      var id = b.getAttribute("data-id"), statut = b.getAttribute("data-statut");
      var res = await sb.from("reservations").update({ statut: statut }).eq("id", id);
      if (res.error) { annoncer("La modification n’a pas été enregistrée.", true); return; }
      reservations.forEach(function (r) { if (r.id === id) r.statut = statut; });
      afficherReservations();
      annoncer({ confirmee: "Réservation confirmée. Pensez à prévenir le client.", annulee: "Réservation annulée.", a_confirmer: "Remise à confirmer." }[statut]);
      return;
    }
    var s = e.target.closest("[data-supprimer-resa]");
    if (s && confirm("Supprimer définitivement cette réservation ?")) {
      var id2 = s.getAttribute("data-supprimer-resa");
      var res2 = await sb.from("reservations").delete().eq("id", id2);
      if (res2.error) { annoncer("Suppression impossible.", true); return; }
      reservations = reservations.filter(function (r) { return r.id !== id2; });
      afficherReservations();
      annoncer("Réservation supprimée.");
    }
  });

  /* ---------- Photos : allègement puis envoi ---------- */
  function alleger(fichier, cote) {
    return new Promise(function (ok) {
      if (!/^image\/(jpeg|png|webp)/.test(fichier.type)) { ok(fichier); return; }
      var img = new Image();
      img.onload = function () {
        var r = Math.min(1, cote / Math.max(img.width, img.height));
        var cv = document.createElement("canvas");
        cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) { URL.revokeObjectURL(img.src); ok(b && b.size < fichier.size ? b : fichier); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { ok(fichier); };
      img.src = URL.createObjectURL(fichier);
    });
  }
  async function envoyerFichier(fichier, dossier) {
    var estVideo = /^video\//.test(fichier.type);
    var corps = estVideo ? fichier : await alleger(fichier, 1600);
    var ext = estVideo ? (fichier.name.split(".").pop() || "mp4").toLowerCase() : (corps.type === "image/jpeg" ? "jpg" : (fichier.name.split(".").pop() || "jpg").toLowerCase());
    var chemin = dossier + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    var res = await sb.storage.from("photos").upload(chemin, corps, { contentType: corps.type || fichier.type, upsert: false });
    if (res.error) throw res.error;
    return sb.storage.from("photos").getPublicUrl(chemin).data.publicUrl;
  }
  function cheminDepuisUrl(url) {
    var m = String(url || "").split("/object/public/photos/")[1];
    return m ? decodeURIComponent(m) : null;
  }
  async function supprimerFichier(url) {
    var chemin = cheminDepuisUrl(url);
    if (chemin) await sb.storage.from("photos").remove([chemin]);
  }

  /* ---------- La carte ---------- */
  var plats = [];
  async function chargerPlats() {
    var res = await sb.from("plats").select("*").order("ordre", { ascending: true }).order("cree_le", { ascending: true });
    if (res.error) { annoncer("Impossible de charger la carte.", true); return; }
    plats = res.data;
    afficherPlats();
  }
  function afficherPlats() {
    var zone = $("#liste-plats");
    if (!plats.length) { zone.innerHTML = '<p class="vide-admin">La carte est vide. Ajoutez votre premier plat.</p>'; return; }
    zone.innerHTML = Object.keys(CATEGORIES).map(function (k) {
      var liste = plats.filter(function (p) { return p.categorie === k; });
      if (!liste.length) return "";
      return '<div class="groupe-plats"><h2>' + echapper(CATEGORIES[k]) + "</h2>" + liste.map(function (p) {
        return '<div class="ligne-plat' + (p.disponible ? "" : " epuise") + '">' +
          (p.photo ? '<img class="vignette" src="' + echapper(p.photo) + '" alt="">' : '<span class="vignette" aria-hidden="true"></span>') +
          '<div class="infos-plat"><button type="button" data-modifier="' + p.id + '"><b>' + echapper(p.nom) + "</b><small>" +
          (p.prix ? echapper(p.prix) : "Sans prix affiché") + ' · </small><span class="modifier">Modifier</span></button></div>' +
          '<label class="bascule" title="Disponible"><input type="checkbox" data-dispo="' + p.id + '"' + (p.disponible ? " checked" : "") +
          ' aria-label="' + echapper(p.nom) + ' disponible"><span class="interrupteur"></span></label></div>';
      }).join("") + "</div>";
    }).join("");
  }
  $("#liste-plats").addEventListener("change", async function (e) {
    var c = e.target.closest("[data-dispo]");
    if (!c) return;
    var id = c.getAttribute("data-dispo");
    var res = await sb.from("plats").update({ disponible: c.checked }).eq("id", id);
    if (res.error) { c.checked = !c.checked; annoncer("La modification n’a pas été enregistrée.", true); return; }
    plats.forEach(function (p) { if (p.id === id) p.disponible = c.checked; });
    afficherPlats();
    var p = plats.filter(function (x) { return x.id === id; })[0];
    annoncer(p.nom + (c.checked ? " : disponible." : " : épuisé."));
  });

  var fiche = $("#fiche-plat");
  var platEdite = null, photoActuelle = "", photoRetiree = false;
  function ouvrirFiche(p) {
    platEdite = p || null;
    photoActuelle = p ? p.photo : "";
    photoRetiree = false;
    $("#fiche-titre").textContent = p ? "Modifier le plat" : "Nouveau plat";
    $("#p-nom").value = p ? p.nom : "";
    $("#p-cat").value = p ? p.categorie : "grillades";
    $("#p-desc").value = p ? p.description : "";
    $("#p-prix").value = p ? p.prix : "";
    $("#p-ordre").value = p ? p.ordre : (plats.length + 1) * 10;
    $("#p-dispo").checked = p ? p.disponible : true;
    $("#p-photo").value = "";
    $("#p-apercu").hidden = !photoActuelle;
    $("#p-apercu img").src = photoActuelle || "";
    $("#p-supprimer").hidden = !p;
    $("#p-erreur").hidden = true;
    $("#p-nom").closest(".champ").classList.remove("erreur");
    $("#p-nom").closest(".champ").querySelector(".msg-erreur").hidden = true;
    fiche.showModal();
  }
  $("#ajouter-plat").addEventListener("click", function () { ouvrirFiche(null); });
  $("#liste-plats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-modifier]");
    if (b) ouvrirFiche(plats.filter(function (p) { return p.id === b.getAttribute("data-modifier"); })[0]);
  });
  fiche.querySelector("[data-fermer]").addEventListener("click", function () { fiche.close(); });
  $("#p-retirer").addEventListener("click", function () { photoRetiree = true; $("#p-apercu").hidden = true; });
  $("#p-photo").addEventListener("change", function () {
    var f = this.files[0];
    if (!f) return;
    $("#p-apercu img").src = URL.createObjectURL(f);
    $("#p-apercu").hidden = false;
    photoRetiree = false;
  });
  $("#form-plat").addEventListener("submit", async function (e) {
    e.preventDefault();
    var nom = $("#p-nom").value.trim();
    var blocNom = $("#p-nom").closest(".champ");
    blocNom.classList.toggle("erreur", !nom);
    blocNom.querySelector(".msg-erreur").hidden = !!nom;
    if (!nom) { $("#p-nom").focus(); return; }
    var bouton = $("#p-enregistrer");
    bouton.disabled = true; bouton.textContent = "Enregistrement…";
    try {
      var photo = photoRetiree ? "" : photoActuelle;
      var nouveau = $("#p-photo").files[0];
      if (nouveau) photo = await envoyerFichier(nouveau, "plats");
      var donnees = {
        nom: nom, categorie: $("#p-cat").value, description: $("#p-desc").value.trim(),
        prix: $("#p-prix").value.trim(), ordre: parseInt($("#p-ordre").value, 10) || 100,
        disponible: $("#p-dispo").checked, photo: photo
      };
      var res = platEdite
        ? await sb.from("plats").update(donnees).eq("id", platEdite.id)
        : await sb.from("plats").insert(donnees);
      if (res.error) throw res.error;
      if (photoActuelle && photo !== photoActuelle) supprimerFichier(photoActuelle);
      fiche.close();
      annoncer(platEdite ? "Plat mis à jour." : "Plat ajouté à la carte.");
      chargerPlats();
    } catch (err) {
      var pe = $("#p-erreur");
      pe.textContent = "L’enregistrement a échoué. Vérifiez la connexion et réessayez.";
      pe.hidden = false;
    } finally {
      bouton.disabled = false; bouton.textContent = "Enregistrer";
    }
  });
  $("#p-supprimer").addEventListener("click", async function () {
    if (!platEdite || !confirm("Supprimer « " + platEdite.nom + " » de la carte ?")) return;
    var res = await sb.from("plats").delete().eq("id", platEdite.id);
    if (res.error) { annoncer("Suppression impossible.", true); return; }
    if (platEdite.photo) supprimerFichier(platEdite.photo);
    fiche.close();
    annoncer("Plat supprimé.");
    chargerPlats();
  });

  /* ---------- Galerie ---------- */
  var galerie = [];
  async function chargerGalerie() {
    var res = await sb.from("galerie").select("*").order("ordre", { ascending: true }).order("cree_le", { ascending: false });
    if (res.error) { annoncer("Impossible de charger la galerie.", true); return; }
    galerie = res.data;
    afficherGalerie();
  }
  function afficherGalerie() {
    var zone = $("#liste-galerie");
    if (!galerie.length) { zone.innerHTML = '<p class="vide-admin" style="grid-column:1/-1">La galerie est vide. Ajoutez vos premières photos ci-dessus.</p>'; return; }
    zone.innerHTML = galerie.map(function (g) {
      var media = g.type === "video"
        ? '<video src="' + echapper(g.fichier) + '" preload="metadata" muted playsinline controls></video>'
        : '<img src="' + echapper(g.fichier) + '" alt="" loading="lazy">';
      return '<div class="element-galerie">' + media + '<div class="pied-element">' +
        '<input value="' + echapper(g.legende) + '" maxlength="140" placeholder="Légende" data-legende="' + g.id + '" aria-label="Légende">' +
        (g.theme !== undefined ? '<select data-theme-media="' + g.id + '" aria-label="Thème">' + [["lac", "Le lac"], ["terrasse", "La terrasse"], ["soir", "Le soir"]].map(function (t) { return '<option value="' + t[0] + '"' + (g.theme === t[0] ? " selected" : "") + ">" + t[1] + "</option>"; }).join("") + "</select>" : "") +
        '<button class="danger" type="button" data-supprimer-media="' + g.id + '">Retirer</button></div></div>';
    }).join("");
  }
  $("#liste-galerie").addEventListener("change", async function (e) {
    var i = e.target.closest("[data-legende]");
    if (!i) return;
    var res = await sb.from("galerie").update({ legende: i.value.trim() }).eq("id", i.getAttribute("data-legende"));
    annoncer(res.error ? "Légende non enregistrée." : "Légende enregistrée.", !!res.error);
  });
  $("#liste-galerie").addEventListener("change", async function (e) {
    var s = e.target.closest("[data-theme-media]");
    if (!s) return;
    var res = await sb.from("galerie").update({ theme: s.value }).eq("id", s.getAttribute("data-theme-media"));
    annoncer(res.error ? "Thème non enregistré." : "Thème enregistré.", !!res.error);
  });
  $("#liste-galerie").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-supprimer-media]");
    if (!b || !confirm("Retirer cet élément de la galerie ?")) return;
    var id = b.getAttribute("data-supprimer-media");
    var g = galerie.filter(function (x) { return x.id === id; })[0];
    var res = await sb.from("galerie").delete().eq("id", id);
    if (res.error) { annoncer("Suppression impossible.", true); return; }
    supprimerFichier(g.fichier);
    galerie = galerie.filter(function (x) { return x.id !== id; });
    afficherGalerie();
    annoncer("Retiré de la galerie.");
  });
  $("#form-galerie").addEventListener("submit", async function (e) {
    e.preventDefault();
    var fichiers = Array.prototype.slice.call($("#gal-fichiers").files);
    if (!fichiers.length) { annoncer("Choisissez au moins une photo ou une vidéo.", true); return; }
    var bouton = this.querySelector('button[type="submit"]');
    var barre = $("#gal-progression");
    bouton.disabled = true; barre.hidden = false;
    var legende = $("#gal-legende").value.trim();
    var echecs = 0;
    for (var i = 0; i < fichiers.length; i++) {
      bouton.textContent = "Envoi " + (i + 1) + " sur " + fichiers.length + "…";
      barre.firstElementChild.style.width = Math.round((i / fichiers.length) * 100) + "%";
      try {
        var url = await envoyerFichier(fichiers[i], "galerie");
        var ligne = { type: /^video\//.test(fichiers[i].type) ? "video" : "photo", fichier: url, legende: legende, theme: $("#gal-theme").value };
        var res = await sb.from("galerie").insert(ligne);
        if (res.error) { delete ligne.theme; res = await sb.from("galerie").insert(ligne); }   // si la colonne « theme » n'existe pas encore
        if (res.error) throw res.error;
      } catch (err) { echecs++; }
    }
    barre.firstElementChild.style.width = "100%";
    setTimeout(function () { barre.hidden = true; barre.firstElementChild.style.width = "0"; }, 600);
    bouton.disabled = false; bouton.textContent = "Ajouter à la galerie";
    this.reset();
    annoncer(echecs ? echecs + " fichier(s) n’ont pas pu être envoyés (trop lourds ?)." : "Ajouté à la galerie.", !!echecs);
    chargerGalerie();
  });

  verifierSession();
})();
