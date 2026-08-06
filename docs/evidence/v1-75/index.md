# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `9de59a818ce20009137d388ebb1e325770ff72e1afb1205079cba4ef24f37e2e`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `198f0c572e4332fdf251bac9bedd509d4c2a8557fa6a37870ac67b6fbbcbb7a4`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `b95f7f7e9bdfa6c75ccaae84acd3f218dba1a7c40c7659882216ce463e1c1c5c`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

