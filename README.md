# Change-Life OS

一個以廣東話設計、瀏覽器優先嘅開源人生管理 OS。

> 反願景 → 90 日主線 → 今日唯一優先 → 深度工作 → 3-2-1 復盤

## 線上版本

[立即使用 Change-Life OS](https://matthew-altx.github.io/change-life-os/)

GitHub Pages 版本毋須註冊。個人資料只會儲存喺目前瀏覽器嘅 `localStorage`，唔會上傳到本專案或第三方伺服器。

## 核心功能

- 四步首次設定：反願景、理想願景、個人利基、90 日主線。
- HUMAN 3.0：心智、身體、精神、天職每日狀態。
- RPG 任務：主線、支線、Boss 戰、XP、Level、連續行動日數。
- 25／50／90 分鐘深度工作計時器。
- Idea → Learn → Teach → Sell 內容飛輪及 PIA 檢查。
- 3-2-1 晚間復盤、一日重置、30 日 Monk Mode。
- 內建廣東話使用指南。
- JSON 匯出、驗證及還原。

## 使用方法

1. 完成四步首次設定，建立反願景同 90 日唯一主線。
2. 每日先填「今日唯一優先」，再開始深度工作計時器。
3. 將重要行動加入任務中心，完成後累積 XP 同技能值。
4. 將真實問題放入內容飛輪，用 Pain、Insight、Action 完成輸出。
5. 每晚做 3-2-1 復盤，定期到「重置」匯出 JSON 備份。

畫面右上角或側欄嘅「使用指南」可以隨時重新打開。

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
```

## 部署

`.github/workflows/pages.yml` 會在每次推送到 `main` 後，自動測試、建構及部署 GitHub Pages。

`google-app/` 保留 Google Apps Script + Firebase Auth + Google Sheets 多帳戶同步版本嘅原始碼；GitHub Pages 公開版本預設採用本機儲存，毋須任何 API key。

## 私隱與安全

- 唔好將真實 Firebase、Google 或其他服務憑證提交到公開 repo。
- GitHub Pages 版本嘅資料只存在使用者目前瀏覽器。
- 清除瀏覽器資料前，請先匯出 JSON 備份。
- 呢個工具唔提供醫療、法律、投資或心理健康專業意見。

## License

[MIT](./LICENSE)
