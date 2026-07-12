import type { I18nGetMessage } from './monetization.ts';
import type {
  ProRouteValidationCampaignReviewBlockerCode,
  ProRouteValidationCampaignReviewPack
} from './pro-route-validation-campaign-review.ts';
import type { ProRouteValidationWritebackPack } from './pro-route-validation-writeback.ts';

export const PRO_STAY_VALIDATION_MESSAGING_GUARD_VERSION = 'v4-14' as const;

export type ProStayValidationMessagingGuardStatus = 'aligned' | 'needs_review' | 'blocked';

export type ProStayValidationMessagingGuardSurfaceId =
  | 'route_headline'
  | 'store_short_description'
  | 'store_value_bullet'
  | 'summary_judgement';

export interface ProStayValidationMessagingGuardSurface {
  surfaceId: ProStayValidationMessagingGuardSurfaceId;
  channel: 'route_page' | 'store_listing' | 'summary';
  text: string;
  requiresValidationLanguage: boolean;
  validationSignals: string[];
  blockedClaimHits: string[];
  status: ProStayValidationMessagingGuardStatus | 'aligned';
  reason: string;
}

export interface ProStayValidationMessagingGuardEvidenceSource {
  label: 'writeback' | 'campaign_review';
  file?: string;
  sha256?: string;
}

export interface ProStayValidationMessagingGuardPack {
  guardVersion: typeof PRO_STAY_VALIDATION_MESSAGING_GUARD_VERSION;
  messagingBoundary: 'stay_validation';
  verdictCode: ProRouteValidationCampaignReviewPack['verdictCode'];
  overallLeaderTrackId: ProRouteValidationCampaignReviewPack['overallLeaderTrackId'];
  overallLeaderTrackTitle: string;
  campaignBlockerCodes: ProRouteValidationCampaignReviewBlockerCode[];
  prioritizedCampaigns: string[];
  requiredValidationSignals: string[];
  blockedClaims: string[];
  boundaries: string[];
  surfaces: ProStayValidationMessagingGuardSurface[];
  guardStatus: ProStayValidationMessagingGuardStatus;
  conclusion: string;
  nextStep: string;
  sources: ProStayValidationMessagingGuardEvidenceSource[];
}

export const PRO_STAY_VALIDATION_MESSAGING_GUARD_FILES = {
  summaryJson: 'copylot-pro-stay-validation-messaging-guard-v4-14.json',
  summaryMd: 'copylot-pro-stay-validation-messaging-guard-v4-14.md'
} as const;

const REQUIRED_VALIDATION_SIGNALS = [
  'current',
  'currently',
  'priority',
  'prioritizing',
  'validation',
  'validating',
  'for now',
  '当前',
  '优先',
  '验证',
  '验证中'
] as const;

const BLOCKED_MONETIZATION_CLAIMS = [
  'subscription',
  'subscribe',
  'paid feature',
  'paid features',
  'pricing is live',
  'upgrade now',
  'buy now',
  '收费功能',
  '付费功能',
  '订阅',
  '付费升级',
  '购买',
  '已上线收费',
  '已提供订阅'
] as const;

function uniq(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function findMatchedSignals(text: string, signals: readonly string[]): string[] {
  const normalized = text.toLowerCase();
  return signals.filter((signal) => normalized.includes(signal.toLowerCase()));
}

function buildSurface(params: {
  surfaceId: ProStayValidationMessagingGuardSurfaceId;
  channel: ProStayValidationMessagingGuardSurface['channel'];
  text: string;
  requiresValidationLanguage: boolean;
  getMessage: I18nGetMessage;
}): ProStayValidationMessagingGuardSurface {
  const validationSignals = params.requiresValidationLanguage
    ? findMatchedSignals(params.text, REQUIRED_VALIDATION_SIGNALS)
    : [];
  const blockedClaimHits = findMatchedSignals(params.text, BLOCKED_MONETIZATION_CLAIMS);

  if (blockedClaimHits.length > 0) {
    return {
      surfaceId: params.surfaceId,
      channel: params.channel,
      text: params.text,
      requiresValidationLanguage: params.requiresValidationLanguage,
      validationSignals,
      blockedClaimHits,
      status: 'blocked',
      reason: params.getMessage('proStayValidationMessagingGuardReasonBlocked', blockedClaimHits.join(', '))
    };
  }

  if (params.requiresValidationLanguage && validationSignals.length === 0) {
    return {
      surfaceId: params.surfaceId,
      channel: params.channel,
      text: params.text,
      requiresValidationLanguage: params.requiresValidationLanguage,
      validationSignals,
      blockedClaimHits,
      status: 'needs_review',
      reason: params.getMessage('proStayValidationMessagingGuardReasonMissingValidation')
    };
  }

  return {
    surfaceId: params.surfaceId,
    channel: params.channel,
    text: params.text,
    requiresValidationLanguage: params.requiresValidationLanguage,
    validationSignals,
    blockedClaimHits,
    status: 'aligned',
    reason: params.getMessage('proStayValidationMessagingGuardReasonAligned')
  };
}

function buildConclusion(
  guardStatus: ProStayValidationMessagingGuardStatus,
  getMessage: I18nGetMessage
): string {
  if (guardStatus === 'blocked') {
    return getMessage('proStayValidationMessagingGuardConclusionBlocked');
  }
  if (guardStatus === 'needs_review') {
    return getMessage('proStayValidationMessagingGuardConclusionNeedsReview');
  }
  return getMessage('proStayValidationMessagingGuardConclusionAligned');
}

function buildNextStep(params: {
  guardStatus: ProStayValidationMessagingGuardStatus;
  prioritizedCampaigns: string[];
  getMessage: I18nGetMessage;
}): string {
  if (params.guardStatus === 'blocked') {
    return params.getMessage('proStayValidationMessagingGuardNextFixBlocked');
  }
  if (params.guardStatus === 'needs_review') {
    return params.getMessage('proStayValidationMessagingGuardNextFixValidation');
  }
  if (params.prioritizedCampaigns.length > 0) {
    return params.getMessage(
      'proStayValidationMessagingGuardNextHoldPrioritized',
      params.prioritizedCampaigns.join(', ')
    );
  }
  return params.getMessage('proStayValidationMessagingGuardNextHoldSteady');
}

export function buildProStayValidationMessagingGuardPack(params: {
  writeback: ProRouteValidationWritebackPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  writebackSource?: { file?: string; sha256?: string };
  campaignReviewSource?: { file?: string; sha256?: string };
  getMessage: I18nGetMessage;
}): ProStayValidationMessagingGuardPack {
  const { writeback, campaignReview, writebackSource, campaignReviewSource, getMessage } = params;

  const surfaces = [
    buildSurface({
      surfaceId: 'route_headline',
      channel: 'route_page',
      text: writeback.routePage.headline,
      requiresValidationLanguage: true,
      getMessage
    }),
    buildSurface({
      surfaceId: 'store_short_description',
      channel: 'store_listing',
      text: writeback.storeCopy.shortDescription,
      requiresValidationLanguage: true,
      getMessage
    }),
    buildSurface({
      surfaceId: 'store_value_bullet',
      channel: 'store_listing',
      text: writeback.storeCopy.bullet,
      requiresValidationLanguage: false,
      getMessage
    }),
    buildSurface({
      surfaceId: 'summary_judgement',
      channel: 'summary',
      text: writeback.summary.judgement,
      requiresValidationLanguage: true,
      getMessage
    })
  ];

  const guardStatus = surfaces.some((surface) => surface.status === 'blocked')
    ? 'blocked'
    : surfaces.some((surface) => surface.status === 'needs_review')
      ? 'needs_review'
      : 'aligned';

  return {
    guardVersion: PRO_STAY_VALIDATION_MESSAGING_GUARD_VERSION,
    messagingBoundary: 'stay_validation',
    verdictCode: campaignReview.verdictCode,
    overallLeaderTrackId: campaignReview.overallLeaderTrackId,
    overallLeaderTrackTitle: campaignReview.overallLeaderTrackTitle,
    campaignBlockerCodes: campaignReview.blockers.map((blocker) => blocker.code),
    prioritizedCampaigns: [...campaignReview.prioritizedCampaigns],
    requiredValidationSignals: [...REQUIRED_VALIDATION_SIGNALS],
    blockedClaims: [...BLOCKED_MONETIZATION_CLAIMS],
    boundaries: uniq([
      writeback.routePage.boundary,
      writeback.storeCopy.boundary,
      getMessage('proRouteValidationCampaignReviewBoundaryStayValidation')
    ]),
    surfaces,
    guardStatus,
    conclusion: buildConclusion(guardStatus, getMessage),
    nextStep: buildNextStep({
      guardStatus,
      prioritizedCampaigns: campaignReview.prioritizedCampaigns,
      getMessage
    }),
    sources: [
      {
        label: 'writeback',
        file: writebackSource?.file,
        sha256: writebackSource?.sha256
      },
      {
        label: 'campaign_review',
        file: campaignReviewSource?.file,
        sha256: campaignReviewSource?.sha256
      }
    ]
  };
}

export function formatProStayValidationMessagingGuardMarkdown(
  pack: ProStayValidationMessagingGuardPack,
  getMessage: I18nGetMessage
): string {
  return [
    `# ${getMessage('proStayValidationMessagingGuardMdTitle')}`,
    '',
    `## ${getMessage('proStayValidationMessagingGuardMdSectionStatus')}`,
    `- guard_status=${pack.guardStatus}`,
    `- messaging_boundary=${pack.messagingBoundary}`,
    `- verdict_code=${pack.verdictCode}`,
    `- overall_leader=${pack.overallLeaderTrackTitle}`,
    `- campaign_blocker_codes=${pack.campaignBlockerCodes.length > 0 ? pack.campaignBlockerCodes.join(', ') : 'none'}`,
    `- prioritized_campaigns=${pack.prioritizedCampaigns.length > 0 ? pack.prioritizedCampaigns.join(', ') : 'none'}`,
    '',
    `## ${getMessage('proStayValidationMessagingGuardMdSectionSurfaces')}`,
    ...pack.surfaces.map((surface) => {
      const validationSignals =
        surface.validationSignals.length > 0 ? surface.validationSignals.join(', ') : 'none';
      const blockedHits =
        surface.blockedClaimHits.length > 0 ? surface.blockedClaimHits.join(', ') : 'none';
      return `- ${surface.surfaceId}: status=${surface.status}; channel=${surface.channel}; requires_validation_language=${surface.requiresValidationLanguage}; validation_signals=${validationSignals}; blocked_claim_hits=${blockedHits}; reason=${surface.reason}; text=${surface.text}`;
    }),
    '',
    `## ${getMessage('proStayValidationMessagingGuardMdSectionBoundaries')}`,
    ...pack.boundaries.map((boundary) => `- ${boundary}`),
    '',
    `## ${getMessage('proStayValidationMessagingGuardMdSectionDecision')}`,
    `- ${pack.conclusion}`,
    `- ${pack.nextStep}`,
    '',
    `## ${getMessage('proStayValidationMessagingGuardMdSectionEvidence')}`,
    ...pack.sources.map((source) => {
      const file = source.file || 'n/a';
      const sha = source.sha256 ? `#${source.sha256}` : '';
      return `- ${source.label}=${file}${sha}`;
    }),
    ''
  ].join('\n');
}
