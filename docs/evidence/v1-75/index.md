# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `4e1bbb95e8c514e6761a97b9f9702aaf1bd9e3a80b4ad46077b8e604675ae7a3`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `6a187ddac0eb732bfbae3285ce4b0b127507dd52a0d80f13dd9b020007219b55`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `b6316788acdc95c9b61766bc9a2068229787a189b39cc313001bb79a7a03cb77`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

