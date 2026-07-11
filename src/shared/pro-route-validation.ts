import {
  buildChromeWebStoreUrl,
  buildPrivacyPolicyUrl,
  buildProRoadmapUrl,
  type ExternalUtmMedium
} from './external-links.ts';
import type { I18nGetMessage } from './monetization.ts';
import type { ProIntentContent } from './pro-intent-attribution.ts';

export type ProValidationTrackId = 'advanced_cleaning' | 'bulk_collection' | 'structured_export';

export type ProValidationAssetAction = 'validation_route' | 'validation_brief' | 'validation_checklist';

export interface ProValidationTrack {
  id: ProValidationTrackId;
  attributionContent: ProIntentContent;
  titleKey: string;
  hintKey: string;
  goalListKey: string;
  boundaryListKey: string;
  signalListKey: string;
  checklistListKey: string;
}

const PRO_VALIDATION_TRACKS: Record<ProValidationTrackId, ProValidationTrack> = {
  advanced_cleaning: {
    id: 'advanced_cleaning',
    attributionContent: 'options_advanced_cleaning_cta',
    titleKey: 'proValidationAdvancedTitle',
    hintKey: 'proValidationAdvancedHint',
    goalListKey: 'proValidationAdvancedGoalList',
    boundaryListKey: 'proValidationAdvancedBoundaryList',
    signalListKey: 'proValidationAdvancedSignalList',
    checklistListKey: 'proValidationAdvancedChecklistList'
  },
  bulk_collection: {
    id: 'bulk_collection',
    attributionContent: 'options_bulk_collection_cta',
    titleKey: 'proValidationBulkTitle',
    hintKey: 'proValidationBulkHint',
    goalListKey: 'proValidationBulkGoalList',
    boundaryListKey: 'proValidationBulkBoundaryList',
    signalListKey: 'proValidationBulkSignalList',
    checklistListKey: 'proValidationBulkChecklistList'
  },
  structured_export: {
    id: 'structured_export',
    attributionContent: 'options_structured_export_cta',
    titleKey: 'proValidationStructuredExportTitle',
    hintKey: 'proValidationStructuredExportHint',
    goalListKey: 'proValidationStructuredExportGoalList',
    boundaryListKey: 'proValidationStructuredExportBoundaryList',
    signalListKey: 'proValidationStructuredExportSignalList',
    checklistListKey: 'proValidationStructuredExportChecklistList'
  }
};

export function getProValidationTrack(trackId: ProValidationTrackId): ProValidationTrack {
  return PRO_VALIDATION_TRACKS[trackId];
}

export function buildProValidationRouteUrl(params: {
  trackId: ProValidationTrackId;
  medium: ExternalUtmMedium;
  campaign?: string | null;
}): string {
  const track = getProValidationTrack(params.trackId);
  return buildProRoadmapUrl({
    medium: params.medium,
    campaign: params.campaign || undefined,
    content: track.attributionContent
  });
}

export function buildProValidationStoreUrl(params: {
  trackId: ProValidationTrackId;
  medium: ExternalUtmMedium;
  campaign?: string | null;
}): string {
  const track = getProValidationTrack(params.trackId);
  return buildChromeWebStoreUrl({
    medium: params.medium,
    campaign: params.campaign || undefined,
    content: track.attributionContent
  });
}

export function buildProValidationPrivacyUrl(params: {
  trackId: ProValidationTrackId;
  medium: ExternalUtmMedium;
  campaign?: string | null;
}): string {
  const track = getProValidationTrack(params.trackId);
  return buildPrivacyPolicyUrl({
    medium: params.medium,
    campaign: params.campaign || undefined,
    content: track.attributionContent
  });
}

export function buildProValidationBriefMarkdown(params: {
  trackId: ProValidationTrackId;
  campaign: string;
  getMessage: I18nGetMessage;
}): string {
  const track = getProValidationTrack(params.trackId);
  const routeUrl = buildProValidationRouteUrl({
    trackId: track.id,
    medium: 'distribution_toolkit',
    campaign: params.campaign
  });
  const storeUrl = buildProValidationStoreUrl({
    trackId: track.id,
    medium: 'distribution_toolkit',
    campaign: params.campaign
  });
  const privacyUrl = buildProValidationPrivacyUrl({
    trackId: track.id,
    medium: 'distribution_toolkit',
    campaign: params.campaign
  });

  return [
    `# ${params.getMessage(track.titleKey)}`,
    '',
    `- ${params.getMessage('proValidationCampaignLabel')}: ${params.campaign}`,
    '',
    `## ${params.getMessage('proValidationBriefGoalsHeading')}`,
    params.getMessage(track.goalListKey),
    '',
    `## ${params.getMessage('proValidationBriefBoundaryHeading')}`,
    params.getMessage(track.boundaryListKey),
    '',
    `## ${params.getMessage('proValidationBriefSignalsHeading')}`,
    params.getMessage(track.signalListKey),
    '',
    `## ${params.getMessage('proValidationBriefLinksHeading')}`,
    `- ${params.getMessage('proValidationRouteLinkLabel')}: ${routeUrl}`,
    `- ${params.getMessage('proValidationStoreLinkLabel')}: ${storeUrl}`,
    `- ${params.getMessage('proValidationPrivacyLinkLabel')}: ${privacyUrl}`,
    ''
  ].join('\n');
}

export function buildProValidationChecklistMarkdown(params: {
  trackId: ProValidationTrackId;
  campaign: string;
  getMessage: I18nGetMessage;
}): string {
  const track = getProValidationTrack(params.trackId);
  const routeUrl = buildProValidationRouteUrl({
    trackId: track.id,
    medium: 'distribution_toolkit',
    campaign: params.campaign
  });

  return [
    `# ${params.getMessage(track.titleKey)} ${params.getMessage('proValidationChecklistHeadingSuffix')}`,
    '',
    `- ${params.getMessage('proValidationCampaignLabel')}: ${params.campaign}`,
    '',
    params.getMessage(track.checklistListKey),
    '',
    `## ${params.getMessage('proValidationChecklistLinksHeading')}`,
    `- ${params.getMessage('proValidationRouteLinkLabel')}: ${routeUrl}`,
    ''
  ].join('\n');
}
