# LoginPage 測試案例

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、表單驗證、Mock API、導航邏輯、Auth 過期處理

---

## [x] 【前端元素】應正確渲染登入頁面的標題、表單欄位與按鈕
**範例輸入**：無（頁面初始載入）
**期待輸出**：顯示「歡迎回來」標題、「請登入以繼續」副標題、Email 輸入框、密碼輸入框、「登入」按鈕

---

## [x] 【前端元素】應顯示正確的 placeholder 文字
**範例輸入**：無（頁面初始載入）
**期待輸出**：Email 欄位顯示 `you@example.com`、密碼欄位顯示 `至少 8 個字元，需包含英數`

---

## [x] 【前端元素】未設定 VITE_API_URL 時應顯示測試帳號提示
**範例輸入**：`import.meta.env.VITE_API_URL` 為空
**期待輸出**：顯示「測試帳號：任意 email 格式 / 密碼需包含英數且8位以上」

---

## [x] 【表單驗證】Email 格式不正確時應顯示錯誤訊息
**範例輸入**：Email = `invalid-email`，點擊登入
**期待輸出**：顯示「請輸入有效的 Email 格式」

---

## [x] 【表單驗證】密碼少於 8 個字元時應顯示錯誤訊息
**範例輸入**：Email = `test@example.com`，密碼 = `abc123`，點擊登入
**期待輸出**：顯示「密碼必須至少 8 個字元」

---

## [x] 【表單驗證】密碼缺少英文字母時應顯示錯誤訊息
**範例輸入**：Email = `test@example.com`，密碼 = `12345678`，點擊登入
**期待輸出**：顯示「密碼必須包含英文字母和數字」

---

## [x] 【表單驗證】密碼缺少數字時應顯示錯誤訊息
**範例輸入**：Email = `test@example.com`，密碼 = `abcdefgh`，點擊登入
**期待輸出**：顯示「密碼必須包含英文字母和數字」

---

## [x] 【表單驗證】Email 和密碼同時不合法時應同時顯示兩個錯誤
**範例輸入**：Email = `bad`，密碼 = `123`，點擊登入
**期待輸出**：同時顯示 Email 錯誤與密碼錯誤訊息

---

## [x] 【表單驗證】驗證不通過時不應呼叫 login API
**範例輸入**：Email = `invalid`，密碼 = `short`，點擊登入
**期待輸出**：`login` 函式不被呼叫

---

## [x] 【Mock API】登入成功後應導航到 /dashboard
**範例輸入**：Email = `test@example.com`，密碼 = `password1`，MSW 回傳 success
**期待輸出**：呼叫 `navigate('/dashboard', { replace: true })`

---

## [x] 【Mock API】登入失敗時應顯示 API 回傳的錯誤訊息
**範例輸入**：Email = `test@example.com`，密碼 = `password1`，MSW 回傳 401 `{ message: '密碼錯誤' }`
**期待輸出**：頁面顯示「密碼錯誤」錯誤橫幅

---

## [x] 【Mock API】API 無回傳 message 時應顯示預設錯誤訊息
**範例輸入**：Email = `test@example.com`，密碼 = `password1`，MSW 回傳 500（無 message 欄位）
**期待輸出**：頁面顯示「登入失敗，請稍後再試」

---

## [x] 【Mock API】登入過程中按鈕應顯示 loading 狀態
**範例輸入**：輸入合法 Email 和密碼，點擊登入（API 有延遲）
**期待輸出**：按鈕文字變為「登入中...」且 disabled

---

## [x] 【Mock API】登入過程中表單欄位應被禁用
**範例輸入**：輸入合法 Email 和密碼，點擊登入（API 有延遲）
**期待輸出**：Email 和密碼輸入框均為 disabled

---

## [x] 【導航邏輯】已登入使用者訪問登入頁應自動導航到 /dashboard
**範例輸入**：`isAuthenticated` 為 `true`
**期待輸出**：自動導航至 `/dashboard`

---

## [x] 【Auth 過期處理】有 authExpiredMessage 時應顯示為 API 錯誤並清除
**範例輸入**：`authExpiredMessage` = `'登入已過期，請重新登入'`
**期待輸出**：頁面顯示該訊息的錯誤橫幅，且 `clearAuthExpiredMessage` 被呼叫

---

## [x] 【前端元素】錯誤橫幅應具有 role="alert" 屬性以支援無障礙
**範例輸入**：觸發 API 錯誤
**期待輸出**：錯誤橫幅元素包含 `role="alert"`

---

## [ ] 【表單驗證】輸入合法資料後先前的驗證錯誤應被清除
**範例輸入**：先輸入不合法欄位觸發錯誤，再修正為合法輸入後重新提交
**期待輸出**：先前的錯誤訊息消失
