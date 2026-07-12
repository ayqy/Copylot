# v4-13 跨 campaign 领先路线复核包样例

## 生成命令

```bash
./node_modules/.bin/ts-node scripts/build-pro-route-validation-campaign-review-pack.ts \
  docs/evidence/v4-10/stability-pack/copylot-pro-route-validation-stability-v4-10.json \
  docs/evidence/v4-11/verdict-pack/copylot-pro-route-validation-verdict-v4-11.json \
  docs/evidence/v4-13/campaign-review-pack
```

## 当前样例结论

- `overallLeaderTrackId = advanced_cleaning`
- `supportingCampaigns = [ph, twitter]`
- `conflictingCampaigns = [reddit, seo]`
- `thinCampaigns = [ph]`
- `prioritizedCampaigns = [ph, reddit, seo]`
- `blockers = [acquisition_bias_unresolved, sample_still_thin]`

## 当前判断

- `advanced_cleaning` 虽然是总领先路线，但 `reddit` 与 `seo` 仍然支持不同 leader，`ph` 的样本也还偏薄，说明当前 acquisition 偏差还没有排除。
- 这份复核包已经把“先去哪里补样本”明确收敛到 `ph / reddit / seo`，不再只是泛泛地说“再收集一些数据”。

## 商业化推进证据

- 继续扩量：
  - `twitter` 已处于 `supporting`，可以继续沿用 `advanced_cleaning` 的验证素材，但话术仍必须停留在 `stay_validation`。
- 继续验证：
  - `ph` 属于 `thin`，说明同一路线有潜力，但当前还缺足够密度的真实任务信号。
  - `reddit` 与 `seo` 属于 `conflicting`，说明不同获客来源还在支持其他路线，必须优先复核。
- 暂缓收费判断：
  - 只要 `acquisition_bias_unresolved` 或 `sample_still_thin` 仍存在，就不能把这次领先解释成稳定可收费需求。

## 结论说明

- 这轮完成的是“跨 campaign 的优先补样能力”，不是“更接近支付实现”。
- 后续重点应继续扩大真实任务样本，并把对外话术严格锁在 `stay_validation`。
