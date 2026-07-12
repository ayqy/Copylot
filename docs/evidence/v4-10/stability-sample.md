# v4-10 领先路线稳定性样例

生成命令：

```bash
./node_modules/.bin/ts-node scripts/build-pro-route-validation-stability-pack.ts \
  docs/evidence/v4-10/route-validation-stability-telemetry-sample.json \
  docs/evidence/v4-10/stability-pack
```

样例结论：

- `overallLeaderTrackId = advanced_cleaning`
- `stableAcrossWindows = true`
- `supportingCampaigns = ["ph", "twitter"]`
- `conflictingCampaigns = ["reddit", "seo"]`
- `verdictCode = leader_stable_campaign_split`

说明：

- 这表示“高级页面清洗验证”在 `7d / 14d` 总体仍领先，但不同 acquisition campaign 还没有完全收敛。
- 因此下一步仍应继续补跨 campaign 的真实任务样本，并把判断和 `v4-9` 回写包、`v1-81` 门槛摘要一起复核。
