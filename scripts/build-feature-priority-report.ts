import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FEATURE_PRIORITY_WEIGHTS, scoreFeatureCandidates, type FeatureCandidate } from './lib/feature-priority.ts';

interface MarketCandidateSignal {
  painFrequency: number;
  growthLeverage: number;
  competitiveGap: number;
  evidence: string[];
}

interface UserCandidateSignal {
  stabilityTestability: number;
  timeToShip: number;
  evidence: string[];
}

interface MarketScanInput {
  capturedAt: string;
  sources: Array<{
    name: string;
    url: string;
    observations: string[];
  }>;
  candidates: Record<string, MarketCandidateSignal>;
}

interface UserSignalInput {
  capturedAt: string;
  aggregateCounts: Record<string, number>;
  repoSignals: Array<{
    path: string;
    observation: string;
  }>;
  candidates: Record<string, UserCandidateSignal>;
}

const CANDIDATE_LABELS: Record<string, string> = {
  semantic_main_article_priority: 'Semantic main/article priority',
  nav_aside_footer_blacklist_pruning: 'Nav/aside/footer blacklist pruning',
  density_based_main_content_selection: 'Density-based main content selection',
  reader_mode_fallback_notice: 'Reader-mode fallback notice'
};

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
}

function assertCandidateKey<T>(input: Record<string, T>, key: string): T {
  const value = input[key];
  if (!value) {
    throw new Error(`Missing candidate signal for key: ${key}`);
  }
  return value;
}

function buildFeatureCandidates(marketScan: MarketScanInput, userSignal: UserSignalInput): FeatureCandidate[] {
  return Object.entries(CANDIDATE_LABELS).map(([key, label]) => {
    const market = assertCandidateKey(marketScan.candidates, key);
    const user = assertCandidateKey(userSignal.candidates, key);

    return {
      key,
      label,
      painFrequency: market.painFrequency,
      growthLeverage: market.growthLeverage,
      competitiveGap: market.competitiveGap,
      stabilityTestability: user.stabilityTestability,
      timeToShip: user.timeToShip,
      evidence: [...market.evidence, ...user.evidence]
    };
  });
}

function renderIndexMarkdown(params: {
  marketScan: MarketScanInput;
  userSignal: UserSignalInput;
  selectedKeys: string[];
  scores: ReturnType<typeof scoreFeatureCandidates>;
}): string {
  const scoreRows = params.scores
    .map(
      (item) =>
        `| ${item.key} | ${item.total} | ${item.breakdown.painFrequency} | ${item.breakdown.growthLeverage} | ${item.breakdown.competitiveGap} | ${item.breakdown.stabilityTestability} | ${item.breakdown.timeToShip} |`
    )
    .join('\n');

  const sourceRows = params.marketScan.sources
    .map((source) => `- ${source.name}: ${source.url}`)
    .join('\n');

  const repoRows = params.userSignal.repoSignals
    .map((signal) => `- ${signal.path}: ${signal.observation}`)
    .join('\n');

  return `# V1-102 Feature Priority Index

## 输入

- market_scan: \`market-scan.json\`
- user_signal: \`user-signal.json\`
- captured_at_market: \`${params.marketScan.capturedAt}\`
- captured_at_user: \`${params.userSignal.capturedAt}\`

## 评分权重

- painFrequency: ${FEATURE_PRIORITY_WEIGHTS.painFrequency}
- growthLeverage: ${FEATURE_PRIORITY_WEIGHTS.growthLeverage}
- competitiveGap: ${FEATURE_PRIORITY_WEIGHTS.competitiveGap}
- stabilityTestability: ${FEATURE_PRIORITY_WEIGHTS.stabilityTestability}
- timeToShip: ${FEATURE_PRIORITY_WEIGHTS.timeToShip}

## 结果

- selected_top2: \`${params.selectedKeys.join(', ')}\`

| candidate | total | pain | growth | gap | stability | ship |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${scoreRows}

## 市场来源

${sourceRows}

## 本地用户信号

${repoRows}

## 聚合计数

\`\`\`json
${JSON.stringify(params.userSignal.aggregateCounts, null, 2)}
\`\`\`
`;
}

async function main(): Promise<void> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDir, '..');
  const evidenceDir = path.join(projectRoot, 'docs/evidence/v1-102');
  const marketScanPath = path.join(evidenceDir, 'market-scan.json');
  const userSignalPath = path.join(evidenceDir, 'user-signal.json');
  const scorecardPath = path.join(evidenceDir, 'feature-scorecard.json');
  const indexPath = path.join(evidenceDir, 'index.md');

  const marketScan = await readJson<MarketScanInput>(marketScanPath);
  const userSignal = await readJson<UserSignalInput>(userSignalPath);

  const candidates = buildFeatureCandidates(marketScan, userSignal);
  const scores = scoreFeatureCandidates(candidates);
  const selectedKeys = scores.slice(0, 2).map((item) => item.key);

  const scorecard = {
    generatedAt: `${marketScan.capturedAt}T00:00:00+08:00`,
    inputs: {
      marketScan: path.relative(projectRoot, marketScanPath),
      userSignal: path.relative(projectRoot, userSignalPath)
    },
    weights: FEATURE_PRIORITY_WEIGHTS,
    selectedKeys,
    scores
  };

  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf-8');
  await fs.writeFile(
    indexPath,
    renderIndexMarkdown({
      marketScan,
      userSignal,
      selectedKeys,
      scores
    }),
    'utf-8'
  );

  console.log(`Wrote ${path.relative(projectRoot, scorecardPath)}`);
  console.log(`Wrote ${path.relative(projectRoot, indexPath)}`);
}

void main();
