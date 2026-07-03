# v1-75 并行增长循环证据包（对外入口一致化 + 投放资产样例）

## 单一事实来源（可审计）
- `src/shared/external-links.ts`
  - sha256: `db2d701b8134254ce7fff52386d2b10b48ec2afeba02ee8ebd2cebaaf3b7dcdc`

## 输出文件清单（可复核）
- `docs/evidence/v1-75/official-links.json`
  - sha256: `8314d3065d3f239c181bb7131ca0287e5a2059f2dd90bca047d359548c4c2174`
- `docs/evidence/v1-75/pro-distribution-pack.sample.md`
  - sha256: `6efb331b89dec491480771778421410e54ba7a3e529fc13b18077a1b9390599e`
- `docs/evidence/v1-75/share-copy.sample.txt`
  - sha256: `a32cd5385fc51a3c080697a03cfd1cac06ba4b546b862855c7e3176e5e644b2d`

## 结论
- PASS

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts`

