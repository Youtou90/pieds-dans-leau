/* =====================================================================
   PIEDS DANS L'EAU : DONNÉES DU SITE
   La carte et la galerie viennent de la base Supabase (page /admin.html).
   Les listes ci-dessous servent de secours si la base ne répond pas,
   et la partie « fiches » relie chaque plat à sa page (plats/xxx.html).
   ===================================================================== */

window.CONTENU = {

  /* ---------- Base en ligne (Supabase) : valeurs publiques ---------- */
  supabaseUrl: "https://jjryipxufpucfxzgmski.supabase.co",
  supabaseCle: "sb_publishable_LTcSkyGX6VkaOZmZj1ZEcg_JfW667t9",
  siteUrl: "https://pieds-dans-leau.vercel.app",

  /* ---------- Coordonnées ---------- */
  whatsapp: "237691256821",
  telephone: "+237659937890",
  telephoneAffiche: "+237 659 93 78 90",
  whatsappAffiche: "+237 691 25 68 21",
  horaires: "Tous les jours, 08\u00a0h\u00a0– 00\u00a0h",
  ouverture: { debut: 8, fin: 24 },
  adresse: "Camp-SIC, quartier Nkolbikon, Bertoua",
  carteLien: "https://www.google.com/maps/search/?api=1&query=Camp+SIC+Nkolbikon+Bertoua",

  /* ---------- Fiches des plats : page dédiée et photos ----------
     La clé est l'identifiant de la page (plats/ekwang.html).
     « nom » doit être identique au nom saisi dans /admin.html. */
  fiches: {
    ekwang: { nom: "Ekwang", photos: ["photos/plats/ekwang.jpg"] },
    koki:   { nom: "Koki chaud", photos: ["photos/plats/koki.jpg"] },
    ndole:  { nom: "Ndolè aux crevettes", photos: ["photos/plats/ndole.jpg"] },
    taro:   { nom: "Taro sauce jaune", photos: ["photos/plats/taro.jpg", "photos/plats/taro-2.jpg"] }
  },

  /* ---------- La carte de secours ---------- */
  carte: [
    { nom: "Ekwang", categorie: "pays", prix: "", photo: "photos/plats/ekwang.jpg", disponible: true,
      description: "Feuilles de macabo râpé roulées une à une, mijotées dans une sauce à l’huile rouge." },
    { nom: "Koki chaud", categorie: "pays", prix: "", photo: "photos/plats/koki.jpg", disponible: true,
      description: "Gâteau de haricots cuit à la vapeur, servi chaud avec ses bâtons de manioc." },
    { nom: "Ndolè aux crevettes", categorie: "pays", prix: "", photo: "photos/plats/ndole.jpg", disponible: true,
      description: "Le grand classique camerounais aux feuilles de ndolè et à l’arachide, garni de crevettes." },
    { nom: "Taro sauce jaune", categorie: "pays", prix: "", photo: "photos/plats/taro.jpg", disponible: true,
      description: "Pâte de taro pilé, servie avec la sauce jaune et ses morceaux de viande." }
  ],

  categories: {
    pays: "Plats du pays",
    grillades: "Grillades",
    poissons: "Poissons du lac",
    boissons: "Boissons"
  },

  /* ---------- La galerie de secours ----------
     theme : "lac", "terrasse" ou "soir" (filtres de la page Galerie) */
  galerie: [
    { type: "photo", theme: "lac", fichier: "photos/lieu/lac-coucher.jpg", legende: "Le lac au coucher du soleil" },
    { type: "photo", theme: "terrasse", fichier: "photos/lieu/terrasse-jour.jpg", legende: "La terrasse sur pilotis" },
    { type: "photo", theme: "soir", fichier: "photos/lieu/soir-salle.jpg", legende: "La salle, le soir" },
    { type: "photo", theme: "lac", fichier: "photos/lieu/lac-pirogue.jpg", legende: "Départ en pirogue" },
    { type: "photo", theme: "terrasse", fichier: "photos/lieu/terrasse.jpg", legende: "Les tables à l’ombre" },
    { type: "photo", theme: "lac", fichier: "photos/lieu/lac-dore.jpg", legende: "Le lac, fin d’après-midi" },
    { type: "photo", theme: "soir", fichier: "photos/lieu/soir-terrasse.jpg", legende: "La terrasse éclairée" },
    { type: "photo", theme: "lac", fichier: "photos/lieu/pirogue.jpg", legende: "La pirogue et ses gilets" },
    { type: "photo", theme: "terrasse", fichier: "photos/lieu/lac-chaises.jpg", legende: "Les chaises au bord de l’eau" },
    { type: "photo", theme: "soir", fichier: "photos/lieu/soir-tables.jpg", legende: "Dîner entre amis" },
    { type: "photo", theme: "terrasse", fichier: "photos/lieu/entree.jpg", legende: "L’entrée" },
    { type: "photo", theme: "soir", fichier: "photos/lieu/soir-fete.jpg", legende: "Une soirée animée" }
  ]
};
