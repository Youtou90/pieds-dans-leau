// Visite quotidienne de la base Supabase, pour qu'elle ne soit pas mise en pause
// faute d'activité (offre gratuite). Appelée chaque jour par Vercel (voir vercel.json).
// Elle ne fait qu'une lecture publique de la carte : aucune donnée n'est modifiée.

const SUPABASE_URL = "https://jjryipxufpucfxzgmski.supabase.co";
const CLE_PUBLIQUE = "sb_publishable_LTcSkyGX6VkaOZmZj1ZEcg_JfW667t9";

export default async function handler(req, res) {
  const debut = Date.now();
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/plats?select=nom&limit=1", {
      headers: { apikey: CLE_PUBLIQUE },
    });
    res.status(200).json({
      base: r.ok ? "réveillée" : "réponse inattendue",
      statut: r.status,
      duree_ms: Date.now() - debut,
      date: new Date().toISOString(),
    });
  } catch (e) {
    res.status(200).json({ base: "injoignable", erreur: String(e), date: new Date().toISOString() });
  }
}
