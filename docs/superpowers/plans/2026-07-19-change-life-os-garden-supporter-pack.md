# Change-Life OS 花園及支持者包實作計劃

## 交付範圍

1. 將本機 state 升級到 v2，加入 growth cycle、daily check-in、garden 同無損 v1 migration。
2. 建立 56 個雙語固定行動、建議 tie-break、每日一粒種子、守護靈階段及 14 日輪替規則。
3. 將守護靈、四維花園、每日行動及私隱完成卡加入現有 Today 畫面。
4. 加入可預覽／切換嘅「初光之園」外觀及本地 entitlement 狀態。
5. 建立 Cloudflare Worker + D1 migration：checkout、webhook、fulfill、redeem、verify。
6. 加入嚴格 origin、固定產品／金額、簽名、冪等、雜湊、速率限制及 feature flag。
7. 完成前端／Worker 單元測試、正式建構、D1 本機 migration、響應式與無障礙瀏覽器驗收。
8. 提供 staging、Stripe test mode、production approval gate 同回退文件；不進行 production 操作。

## 驗收

- 所有既有同新增測試通過；v1 任務、XP、願景、內容、復盤保持不變。
- 390px、平板、桌面無水平溢出，鍵盤可操作，reduced motion 生效。
- 完成卡無私人文字或分數。
- 公開 repo 無 secrets，D1 schema 無玩法欄位。
- 付款關閉時外觀預覽仍可用；只有啟用 feature flag 同 API URL 後先可購買／恢復。
