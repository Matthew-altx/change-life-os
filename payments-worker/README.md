# Change-Life OS Payments Worker

獨立 Cloudflare Worker + D1，處理 HK$7「初光之園・支持者包」。付款只解鎖外觀；玩法資料永遠唔會傳入呢個 Worker。

## 安全邊界

- `/api/checkout` 只接受固定 `first-light-garden`，金額同 Stripe Price 由伺服器決定。
- `/api/stripe/webhook` 驗證原始 request body 簽名，並冪等處理成功付款、退款及爭議。
- 恢復碼以 HMAC-SHA-256 產生 100-bit Crockford Base32 值；D1 只保存 SHA-256 雜湊。
- 瀏覽器 API 使用嚴格 origin allowlist、8 KB request 上限、通用錯誤訊息同 D1 速率限制。
- D1 schema 無電郵、卡資料、四維、任務、願景或復盤欄位。

## 首次 staging 設定

1. 喺 Cloudflare 建立 staging D1，將真實 database ID 寫入 `wrangler.toml`，取代全零 sentinel。
2. 喺 Stripe test mode 建立一次付款 Price：`HKD 7.00`，產品對應 `first-light-garden`。
3. 設定以下 Worker secrets；只設定名稱同值到 Cloudflare，唔好提交 `.dev.vars`：

```bash
npx wrangler secret put STRIPE_SECRET_KEY --config payments-worker/wrangler.toml
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config payments-worker/wrangler.toml
npx wrangler secret put STRIPE_PRICE_FIRST_LIGHT_GARDEN --config payments-worker/wrangler.toml
npx wrangler secret put ENTITLEMENT_SIGNING_SECRET --config payments-worker/wrangler.toml
```

`ENTITLEMENT_SIGNING_SECRET` 應為最少 32 bytes 密碼學安全隨機值。另按實際 staging 網址更新 `ALLOWED_ORIGINS` 同 `SUCCESS_URL`。

4. 套用 migration、測試及部署 staging：

```bash
npm ci
npm run test:payments
npm run typecheck:payments
npm run db:migrate:payments:local
npx wrangler d1 migrations apply change-life-os-payments --remote --config payments-worker/wrangler.toml
npm run build:payments
npx wrangler deploy --config payments-worker/wrangler.toml
```

5. Stripe webhook 指向 `/api/stripe/webhook`，訂閱：

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

6. 前端 staging 建構設定：

```text
VITE_COMMERCE_ENABLED=true
VITE_PAYMENT_API_BASE=https://<staging-worker-host>
```

未設定或將 `VITE_COMMERCE_ENABLED` 改為其他值時，預覽仍可用，購買及恢復按鈕會停用。

## 驗收清單

- Stripe test mode：成功、取消、失敗、延遲及重複 webhook。
- 拒絕錯產品、錯金額、錯 Price、錯 origin、安裝代號不符及無效恢復碼。
- 退款後 entitlement 為 `revoked`；爭議期間為 `suspended`，勝訴恢復 `active`。
- 重複 fulfill／webhook 唔會建立第二份權益。
- D1 schema 同 request logs 無玩法內容；公開 repo 掃描唔到密鑰。

真實 HK$7 交易、production secrets、remote migration 同部署一律要另行明確批准。

## 回退

1. GitHub variable `VITE_COMMERCE_ENABLED=false` 後重新部署 Pages。
2. 喺 Stripe 停用 Price。
3. 回退 Worker 程式，但保留 D1 購買及 entitlement 記錄。
4. 恢復服務時繼續承認既有有效恢復碼。
