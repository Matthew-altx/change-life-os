# Change-Life OS

一個以廣東話設計、瀏覽器優先嘅開源人生管理 OS。

> 反願景 → 90 日主線 → 今日唯一優先 → 深度工作 → 3-2-1 復盤

## 線上版本

[立即使用 Change-Life OS](https://matthew-altx.github.io/change-life-os/)

GitHub Pages 版本毋須註冊。願景、任務、四維分數、行動及復盤等玩法資料只會儲存喺目前瀏覽器嘅 `localStorage`。選擇購買外觀包時，只有付款及權益驗證會經 Stripe 同獨立 Cloudflare Worker 處理。

## 核心功能

- 四步首次設定：反願景、理想願景、個人利基、90 日主線。
- HUMAN 3.0：心智、身體、精神、天職每日狀態。
- 生命花園：每日由四維狀態選一個細行動，14 日內完成 7 日，令守護靈同花園成長；斷日不扣分。
- 56 個廣東話／英文預設行動：每維各有 7 個約 2 分鐘及 7 個約 10 分鐘選項，亦可自訂。
- RPG 任務：主線、支線、Boss 戰、XP、Level、連續行動日數。
- 25／50／90 分鐘深度工作計時器。
- Idea → Learn → Teach → Sell 內容飛輪及 PIA 檢查。
- 3-2-1 晚間復盤、一日重置、30 日 Monk Mode。
- 完整廣東話／英文介面，預設廣東話，可用「中／EN」一鍵切換。
- 內建情境使用指南，逐頁說明 Why／How／Done when（點解做／點做／完成標準）。
- JSON 匯出、驗證及還原。
- 可完整預覽 HK$7「初光之園・支持者包」；付費只解鎖七項外觀，不影響 XP、種子或成長速度。

## 使用方法

1. 完成四步首次設定，建立反願景同 90 日唯一主線。
2. 每日先填「今日唯一優先」，再開始深度工作計時器。
3. 為心智、身體、精神、天職各打 1–5 分，確認今日想照顧嘅一維，完成一個細行動取得生命種子。
4. 將重要行動加入任務中心，完成後累積 XP 同技能值。
5. 將真實問題放入內容飛輪，用 Pain、Insight、Action 完成輸出。
6. 每晚做 3-2-1 復盤，定期到「重置」匯出 JSON 備份。

## 語言與使用指南

- 系統預設使用廣東話；畫面上嘅「中／EN」可以隨時切換完整介面語言。
- 語言選擇會保留喺目前瀏覽器，切換語言唔會改動任務、願景、內容或其他個人資料。
- 首次完成設定並進入主介面時，系統會自動顯示五步啟動引導。
- 之後可按畫面上方或側欄嘅「？ 使用指南／? Guide」重新打開，查看目前模組嘅 Why／How／Done when。

## 本機開發

需要 Node.js 22.13 或以上。

```bash
npm install
npm run dev:pages
```

正式建構：

```bash
npm run build:pages
```

完整測試：

```bash
npm test
npm run test:google
npm run test:pages
npm run test:payments
```

## 部署

`.github/workflows/pages.yml` 會在每次推送到 `main` 後，自動測試、建構及部署 GitHub Pages。

付款功能預設關閉。完成 Stripe test mode、D1 migration、Worker staging 驗收後，先喺 GitHub repository variables 設定 `VITE_COMMERCE_ENABLED=true` 及 `VITE_PAYMENT_API_BASE`。完整設定及回退流程見 [`payments-worker/README.md`](./payments-worker/README.md)。

`google-app/` 保留 Google Apps Script + Firebase Auth + Google Sheets 多帳戶同步版本嘅原始碼；GitHub Pages 公開版本預設採用本機儲存，毋須任何 API key。

## 私隱與安全

- 唔好將真實 Firebase、Google 或其他服務憑證提交到公開 repo。
- 所有玩法資料只存在使用者目前瀏覽器；付款請求不包含四維分數、任務、願景或復盤。
- D1 只保存 Stripe 交易識別碼、固定產品／金額、付款狀態、安裝代號雜湊、權益狀態及時間；恢復碼只保存 SHA-256 雜湊。
- 公開 repo 不應包含 Stripe、Cloudflare 或其他服務密鑰。
- 清除瀏覽器資料前，請先匯出 JSON 備份。
- 呢個工具唔提供醫療、法律、投資或心理健康專業意見。

## License

[MIT](./LICENSE)
