# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `22e4ccff22c2579b05e146250d2576dd5a2f98b814b65c7098a148bdb2e131c4`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `70b9c2ca0d6f57ab0fd29e474f74d2ece381590db76ef9bafe5fecd89fe1f220`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `493b43fcd4b3a61029df755aa5acdfd16301faa3c4dee241236c5bde02f4e568`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

