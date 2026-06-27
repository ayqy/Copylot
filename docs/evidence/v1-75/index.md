# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `22e4ccff22c2579b05e146250d2576dd5a2f98b814b65c7098a148bdb2e131c4`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `87ac003b771f2e71280098fc230b8c6b5ad03873a6f14dc60787bc86ddfb15bd`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `3999d6564f76cbf498b456b020590d4aca33f2903db8916e26fde71aaf1e62f3`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

