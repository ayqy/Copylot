function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatProAcquisitionEfficiencyByCampaignEvidencePackJsonFilename(
  exportedAt: number,
  isAnonymousUsageDataEnabled: boolean
): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const suffix = isAnonymousUsageDataEnabled ? 'on' : 'off';
  return `copylot-pro-acq-eff-by-campaign-evidence-pack-${yyyy}-${mm}-${dd}.${suffix}.json`;
}

