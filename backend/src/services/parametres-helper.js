// backend/src/services/parametres-helper.js
// Helper qui normalise les noms de champs : Supabase renvoie "nomentreprise"
// mais les routes PDF lisent "smi.nomEntreprise" → ce helper fait le pont.

const DEFAULT_PARAMETRES = {
  nomEntreprise: 'Sénégal Multiservices International SARL',
  adresse: '162 Sacré Cœur III VDN, Dakar',
  email: 'contact@smi.sn',
  telephone: '+221 77 XXX XXXX',
  siret: '',
  devise: 'FCFA',
  dateformatage: 'DD/MM/YYYY',
  montantLimiteDepense: 50000000,
  joursRetardPaiement: 1,
  alerteEmail: false,
  alerteWhatsapp: false,
  emailSmtp: '',
  emailPort: 587,
  emailUser: '',
  emailPassword: '',
  emailDestinataireRapports: '',
  whatsappToken: '',
  whatsappNumero: '',
  tauxIs: 0,
  tauxTva: 18,
  anneFiscale: new Date().getFullYear()
};

export async function getParametres(supabase) {
  try {
    const { data, error } = await supabase
      .from('parametres')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('⚠️ Erreur chargement paramètres:', error.message);
      return { ...DEFAULT_PARAMETRES };
    }

    if (!data) {
      console.log('ℹ️ Aucun paramètre en base, utilisation des valeurs par défaut');
      return { ...DEFAULT_PARAMETRES };
    }

    return {
      ...DEFAULT_PARAMETRES,
      nomEntreprise: data.nomentreprise || data.nomEntreprise || DEFAULT_PARAMETRES.nomEntreprise,
      adresse: data.adresse || DEFAULT_PARAMETRES.adresse,
      email: data.email || DEFAULT_PARAMETRES.email,
      telephone: data.telephone || DEFAULT_PARAMETRES.telephone,
      siret: data.siret || '',
      devise: data.devise || 'FCFA',
      dateformatage: data.dateformatage || 'DD/MM/YYYY',
      montantLimiteDepense: data.montantlimitedépense ?? data.montantLimiteDepense ?? DEFAULT_PARAMETRES.montantLimiteDepense,
      joursRetardPaiement: data.joursretardpaiement ?? data.joursRetardPaiement ?? DEFAULT_PARAMETRES.joursRetardPaiement,
      alerteEmail: data.alerteemail ?? data.alerteEmail ?? false,
      alerteWhatsapp: data.alertewhatsapp ?? data.alerteWhatsapp ?? false,
      emailSmtp: data.emailsmtp || data.emailSmtp || '',
      emailPort: data.emailport ?? data.emailPort ?? 587,
      emailUser: data.emailuser || data.emailUser || '',
      emailPassword: data.emailpassword || data.emailPassword || '',
      emailDestinataireRapports: data.emaildestinatairerapports || data.emailDestinataireRapports || '',
      whatsappToken: data.whatsapptoken || data.whatsappToken || '',
      whatsappNumero: data.whatsappnumero || data.whatsappNumero || '',
      tauxIs: data.tauxis ?? data.tauxIs ?? 0,
      tauxTva: data.tauxtva ?? data.tauxTva ?? 18,
      anneFiscale: data.annefiscale ?? data.anneFiscale ?? new Date().getFullYear(),
      _raw: data
    };
  } catch (err) {
    console.error('❌ Erreur getParametres:', err);
    return { ...DEFAULT_PARAMETRES };
  }
}