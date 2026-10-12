/* =====================================================================
   PIEDS DANS L'EAU : LE FICHIER À MODIFIER
   Tout ce qui change souvent est ici : coordonnées, carte, galerie.
   Après une modification, enregistrez le fichier : le site se met à jour.
   ===================================================================== */

window.CONTENU = {

  /* ---------- Coordonnées ---------- */
  whatsapp: "237691256821",          // sans + ni espaces
  telephone: "+237659937890",
  telephoneAffiche: "+237 659 93 78 90",
  whatsappAffiche: "+237 691 25 68 21",
  horaires: "Tous les jours, de 8 h à minuit",   // À CONFIRMER avec les horaires exacts
  adresse: "Camp-SIC, quartier Nkolbikon, Bertoua",
  carteLien: "https://www.google.com/maps/search/?api=1&query=Camp+SIC+Nkolbikon+Bertoua",

  /* ---------- La carte ----------
     categorie : "grillades", "poissons", "pays" ou "boissons"
     prix      : "" pour ne rien afficher, ou par exemple "3 500 FCFA"
     photo     : "" en attendant, ou par exemple "photos/ndole.jpg"
     disponible: true ou false (false affiche « Épuisé aujourd'hui ») */
  carte: [
    { nom: "Poisson braisé du lac", categorie: "poissons", prix: "", photo: "", disponible: true,
      description: "Pêché dans le lac, braisé et servi tout frais, avec ses accompagnements." },
    { nom: "Porc braisé", categorie: "grillades", prix: "", photo: "", disponible: true,
      description: "Du porc braisé, servi bien chaud." },
    { nom: "Grillades", categorie: "grillades", prix: "", photo: "", disponible: true,
      description: "Des viandes grillées au feu de bois, servies chaudes, les pieds dans l'eau." },
    { nom: "Ndolè", categorie: "pays", prix: "", photo: "", disponible: true,
      description: "Le grand classique camerounais : feuilles de ndolè et pâte d'arachide." },
    { nom: "Koko", categorie: "pays", prix: "", photo: "", disponible: true,
      description: "Les feuilles de koko finement coupées et mijotées." },
    { nom: "Boissons fraîches", categorie: "boissons", prix: "", photo: "", disponible: true,
      description: "Pour accompagner le repas ou simplement se détendre au bord de l'eau." }
  ],

  categories: {
    grillades: "Grillades",
    poissons: "Poissons du lac",
    pays: "Plats du pays",
    boissons: "Boissons"
  },

  /* ---------- La galerie ----------
     Déposez les fichiers dans le dossier site/photos, puis ajoutez une ligne :
     { type: "photo", fichier: "photos/lac-soir.jpg", legende: "Le lac au coucher du soleil" },
     { type: "video", fichier: "photos/pirogue.mp4", legende: "Balade en pirogue" },
     Tant que la liste est vide, la page affiche « Les photos arrivent bientôt ». */
  galerie: [
  ]
};
