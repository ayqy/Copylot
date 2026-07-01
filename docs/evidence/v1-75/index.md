# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `6cbea7aed46aa40a25c04e523d366e78904a07f9e1b34c0fe9f5ddb8394fcee0`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `6de031471606b52bd75f3fc9e53016870905d3de035c9ccce6ac7882ad848fca`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `110cf91fd5f49695bb7a6f8d84061f83cc21a4a4bf190128c3bad5732fdf1997`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

