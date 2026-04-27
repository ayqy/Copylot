export interface FeatureCandidate {
  key: string;
  label: string;
  painFrequency: number;
  growthLeverage: number;
  competitiveGap: number;
  stabilityTestability: number;
  timeToShip: number;
  evidence: string[];
}

export interface FeatureScoreBreakdown {
  painFrequency: number;
  growthLeverage: number;
  competitiveGap: number;
  stabilityTestability: number;
  timeToShip: number;
}

export interface FeatureScore {
  key: string;
  label: string;
  total: number;
  breakdown: FeatureScoreBreakdown;
  evidence: string[];
}

export const FEATURE_PRIORITY_WEIGHTS = Object.freeze({
  painFrequency: 0.3,
  growthLeverage: 0.25,
  competitiveGap: 0.2,
  stabilityTestability: 0.15,
  timeToShip: 0.1
});

export function scoreFeatureCandidate(candidate: FeatureCandidate): FeatureScore {
  const breakdown: FeatureScoreBreakdown = {
    painFrequency: candidate.painFrequency,
    growthLeverage: candidate.growthLeverage,
    competitiveGap: candidate.competitiveGap,
    stabilityTestability: candidate.stabilityTestability,
    timeToShip: candidate.timeToShip
  };

  const total =
    breakdown.painFrequency * FEATURE_PRIORITY_WEIGHTS.painFrequency +
    breakdown.growthLeverage * FEATURE_PRIORITY_WEIGHTS.growthLeverage +
    breakdown.competitiveGap * FEATURE_PRIORITY_WEIGHTS.competitiveGap +
    breakdown.stabilityTestability * FEATURE_PRIORITY_WEIGHTS.stabilityTestability +
    breakdown.timeToShip * FEATURE_PRIORITY_WEIGHTS.timeToShip;

  return {
    key: candidate.key,
    label: candidate.label,
    total: Number(total.toFixed(4)),
    breakdown,
    evidence: candidate.evidence
  };
}

export function scoreFeatureCandidates(candidates: FeatureCandidate[]): FeatureScore[] {
  return candidates
    .map(scoreFeatureCandidate)
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.breakdown.painFrequency !== a.breakdown.painFrequency) {
        return b.breakdown.painFrequency - a.breakdown.painFrequency;
      }
      if (b.breakdown.growthLeverage !== a.breakdown.growthLeverage) {
        return b.breakdown.growthLeverage - a.breakdown.growthLeverage;
      }
      return b.breakdown.stabilityTestability - a.breakdown.stabilityTestability;
    });
}
