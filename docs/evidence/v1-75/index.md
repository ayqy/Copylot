# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `22e4ccff22c2579b05e146250d2576dd5a2f98b814b65c7098a148bdb2e131c4`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `89c4abfccdc1e1c3f2e66f9ae779d4a7c21ad372feae98c78f771b54362098fd`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `cd09ba6033b5c86654c929fef1043efbc7b13eeb859f274e246c1caf3f10b30c`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

