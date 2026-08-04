# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `9de59a818ce20009137d388ebb1e325770ff72e1afb1205079cba4ef24f37e2e`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `e258b39e159994fb3a8f3107bdbfca6448d7043b43d9c85abbfcd1c8d138f118`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `784c532f64d945d136e3f26244dff28d3eeac2910e7d9137a75100d9f5a3dd92`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

