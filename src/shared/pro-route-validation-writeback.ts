import type { I18nGetMessage } from './monetization.ts';
import type {
  ProRouteValidationComparisonSummary,
  ProRouteValidationComparisonTrackSummary
} from './pro-route-validation-comparison.ts';
import type { ProValidationTrackId } from './pro-route-validation.ts';

export interface ProRouteValidationWritebackPack {
  leadingTrackId: ProValidationTrackId | 'none';
  leadingTrackTitle: string;
  signalGap: number;
  totalSignals: number;
  sourceSummaryFile?: string;
  sourceSummarySha256?: string;
  routePage: {
    headline: string;
    proof: string;
    boundary: string;
  };
  storeCopy: {
    shortDescription: string;
    bullet: string;
    boundary: string;
  };
  summary: {
    judgement: string;
    nextStep: string;
  };
}

export const PRO_ROUTE_VALIDATION_WRITEBACK_FILES = {
  summaryJson: 'copylot-pro-route-validation-writeback-v4-9.json',
  summaryMd: 'copylot-pro-route-validation-writeback-v4-9.md'
} as const;

function getTrackScenarioKey(trackId: ProValidationTrackId): string {
  if (trackId === 'advanced_cleaning') return 'proRouteValidationWritebackScenarioAdvanced';
  if (trackId === 'bulk_collection') return 'proRouteValidationWritebackScenarioBulk';
  return 'proRouteValidationWritebackScenarioStructured';
}

function getTrackValueKey(trackId: ProValidationTrackId): string {
  if (trackId === 'advanced_cleaning') return 'proRouteValidationWritebackValueAdvanced';
  if (trackId === 'bulk_collection') return 'proRouteValidationWritebackValueBulk';
  return 'proRouteValidationWritebackValueStructured';
}

function getTrackFocusKey(trackId: ProValidationTrackId): string {
  if (trackId === 'advanced_cleaning') return 'proRouteValidationWritebackFocusAdvanced';
  if (trackId === 'bulk_collection') return 'proRouteValidationWritebackFocusBulk';
  return 'proRouteValidationWritebackFocusStructured';
}

function getLeadingTrack(
  summary: ProRouteValidationComparisonSummary
): ProRouteValidationComparisonTrackSummary | null {
  if (summary.leadingTrackId === 'none') return null;
  return summary.tracks.find((track) => track.trackId === summary.leadingTrackId) || null;
}

export function buildProRouteValidationWritebackPack(
  summary: ProRouteValidationComparisonSummary,
  getMessage: I18nGetMessage
): ProRouteValidationWritebackPack {
  const leadingTrack = getLeadingTrack(summary);
  if (!leadingTrack || summary.leadingTrackId === 'none') {
    const fallback = getMessage('proRouteValidationWritebackNoLeader');
    return {
      leadingTrackId: 'none',
      leadingTrackTitle: fallback,
      signalGap: 0,
      totalSignals: summary.totalSignals,
      sourceSummaryFile: summary.telemetryFile,
      sourceSummarySha256: summary.telemetrySha256,
      routePage: {
        headline: fallback,
        proof: fallback,
        boundary: getMessage('proRouteValidationWritebackBoundary')
      },
      storeCopy: {
        shortDescription: fallback,
        bullet: fallback,
        boundary: getMessage('proRouteValidationWritebackStoreBoundary')
      },
      summary: {
        judgement: fallback,
        nextStep: getMessage('proRouteValidationWritebackSummaryNext')
      }
    };
  }

  const scenario = getMessage(getTrackScenarioKey(leadingTrack.trackId));
  const value = getMessage(getTrackValueKey(leadingTrack.trackId));
  const focus = getMessage(getTrackFocusKey(leadingTrack.trackId));
  const totalCopies = leadingTrack.totalCopies;

  return {
    leadingTrackId: leadingTrack.trackId,
    leadingTrackTitle: leadingTrack.title,
    signalGap: summary.signalGap,
    totalSignals: leadingTrack.totalSignals,
    sourceSummaryFile: summary.telemetryFile,
    sourceSummarySha256: summary.telemetrySha256,
    routePage: {
      headline: getMessage('proRouteValidationWritebackRouteHeadline', [
        leadingTrack.title,
        scenario
      ]),
      proof: getMessage('proRouteValidationWritebackRouteProof', [
        String(leadingTrack.totalSignals),
        String(summary.signalGap),
        String(leadingTrack.routeOpened),
        String(totalCopies)
      ]),
      boundary: getMessage('proRouteValidationWritebackBoundary')
    },
    storeCopy: {
      shortDescription: getMessage('proRouteValidationWritebackStoreShort', [
        leadingTrack.title,
        scenario
      ]),
      bullet: getMessage('proRouteValidationWritebackStoreBullet', value),
      boundary: getMessage('proRouteValidationWritebackStoreBoundary')
    },
    summary: {
      judgement: getMessage('proRouteValidationWritebackSummaryJudgement', [
        leadingTrack.title,
        focus
      ]),
      nextStep: getMessage('proRouteValidationWritebackSummaryNext')
    }
  };
}

export function formatProRouteValidationWritebackMarkdown(
  pack: ProRouteValidationWritebackPack,
  getMessage: I18nGetMessage
): string {
  return [
    `# ${getMessage('proRouteValidationWritebackMdTitle')}`,
    '',
    `## ${getMessage('proRouteValidationWritebackMdSectionRoutePage')}`,
    `- ${pack.routePage.headline}`,
    `- ${pack.routePage.proof}`,
    `- ${pack.routePage.boundary}`,
    '',
    `## ${getMessage('proRouteValidationWritebackMdSectionStore')}`,
    `- ${pack.storeCopy.shortDescription}`,
    `- ${pack.storeCopy.bullet}`,
    `- ${pack.storeCopy.boundary}`,
    '',
    `## ${getMessage('proRouteValidationWritebackMdSectionSummary')}`,
    `- ${pack.summary.judgement}`,
    `- ${pack.summary.nextStep}`,
    ''
  ].join('\n');
}
