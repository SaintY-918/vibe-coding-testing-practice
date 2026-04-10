import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

// ── Mock react-router-dom navigate ──
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// ── Mock useAuth ──
const mockLogin = vi.fn();
const mockClearAuthExpiredMessage = vi.fn();
let mockAuthValue = {
    login: mockLogin,
    isAuthenticated: false,
    authExpiredMessage: null as string | null,
    clearAuthExpiredMessage: mockClearAuthExpiredMessage,
};

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockAuthValue,
}));

// ── Helpers ──
const renderLoginPage = () =>
    render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>,
    );

const fillAndSubmit = async (
    user: ReturnType<typeof userEvent.setup>,
    email: string,
    password: string,
) => {
    await user.type(screen.getByLabelText('電子郵件'), email);
    await user.type(screen.getByLabelText('密碼'), password);
    await user.click(screen.getByRole('button', { name: /登入/ }));
};

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthValue = {
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: null,
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
        };
    });

    // ─────────────────────────────────────────────
    describe('前端元素', () => {
        it('應正確渲染登入頁面的標題、表單欄位與按鈕', () => {
            renderLoginPage();

            expect(screen.getByText('歡迎回來')).toBeInTheDocument();
            expect(screen.getByText('請登入以繼續')).toBeInTheDocument();
            expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
            expect(screen.getByLabelText('密碼')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
        });

        it('應顯示正確的 placeholder 文字', () => {
            renderLoginPage();

            expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('至少 8 個字元，需包含英數')).toBeInTheDocument();
        });

        it('未設定 VITE_API_URL 時應顯示測試帳號提示', () => {
            renderLoginPage();

            expect(
                screen.getByText('測試帳號：任意 email 格式 / 密碼需包含英數且8位以上'),
            ).toBeInTheDocument();
        });

        it('錯誤橫幅應具有 role="alert" 屬性以支援無障礙', async () => {
            const user = userEvent.setup();
            mockLogin.mockRejectedValueOnce({
                response: { data: { message: '密碼錯誤' } },
            });

            renderLoginPage();
            await fillAndSubmit(user, 'test@example.com', 'password1');

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
        });
    });

    // ─────────────────────────────────────────────
    describe('表單驗證', () => {
        it('Email 格式不正確時應顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await fillAndSubmit(user, 'invalid-email', 'password1');

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
        });

        it('密碼少於 8 個字元時應顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await fillAndSubmit(user, 'test@example.com', 'abc123');

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
        });

        it('密碼缺少英文字母時應顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await fillAndSubmit(user, 'test@example.com', '12345678');

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
        });

        it('密碼缺少數字時應顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await fillAndSubmit(user, 'test@example.com', 'abcdefgh');

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
        });

        it('Email 和密碼同時不合法時應同時顯示兩個錯誤', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await fillAndSubmit(user, 'bad', '123');

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
        });

        it('驗證不通過時不應呼叫 login API', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await fillAndSubmit(user, 'invalid', 'short');

            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('輸入合法資料後先前的驗證錯誤應被清除', async () => {
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce(undefined);
            renderLoginPage();

            // 先觸發錯誤
            await fillAndSubmit(user, 'bad', '123');
            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();

            // 清除並輸入合法資料
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            await user.clear(emailInput);
            await user.clear(passwordInput);
            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password1');
            await user.click(screen.getByRole('button', { name: /登入/ }));

            expect(screen.queryByText('請輸入有效的 Email 格式')).not.toBeInTheDocument();
            expect(screen.queryByText('密碼必須至少 8 個字元')).not.toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────
    describe('Mock API', () => {
        it('登入成功後應導航到 /dashboard', async () => {
            const user = userEvent.setup();
            mockLogin.mockResolvedValueOnce(undefined);
            renderLoginPage();

            await fillAndSubmit(user, 'test@example.com', 'password1');

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('登入失敗時應顯示 API 回傳的錯誤訊息', async () => {
            const user = userEvent.setup();
            mockLogin.mockRejectedValueOnce({
                response: { data: { message: '密碼錯誤' } },
            });
            renderLoginPage();

            await fillAndSubmit(user, 'test@example.com', 'password1');

            await waitFor(() => {
                expect(screen.getByText('密碼錯誤')).toBeInTheDocument();
            });
        });

        it('API 無回傳 message 時應顯示預設錯誤訊息', async () => {
            const user = userEvent.setup();
            mockLogin.mockRejectedValueOnce({
                response: { data: {} },
            });
            renderLoginPage();

            await fillAndSubmit(user, 'test@example.com', 'password1');

            await waitFor(() => {
                expect(screen.getByText('登入失敗，請稍後再試')).toBeInTheDocument();
            });
        });

        it('登入過程中按鈕應顯示 loading 狀態', async () => {
            const user = userEvent.setup();
            // login 永遠不 resolve，模擬 loading 中
            mockLogin.mockImplementationOnce(() => new Promise(() => {}));
            renderLoginPage();

            await fillAndSubmit(user, 'test@example.com', 'password1');

            await waitFor(() => {
                const button = screen.getByRole('button');
                expect(button).toHaveTextContent('登入中...');
                expect(button).toBeDisabled();
            });
        });

        it('登入過程中表單欄位應被禁用', async () => {
            const user = userEvent.setup();
            mockLogin.mockImplementationOnce(() => new Promise(() => {}));
            renderLoginPage();

            await fillAndSubmit(user, 'test@example.com', 'password1');

            await waitFor(() => {
                expect(screen.getByLabelText('電子郵件')).toBeDisabled();
                expect(screen.getByLabelText('密碼')).toBeDisabled();
            });
        });
    });

    // ─────────────────────────────────────────────
    describe('導航邏輯', () => {
        it('已登入使用者訪問登入頁應自動導航到 /dashboard', () => {
            mockAuthValue = {
                ...mockAuthValue,
                isAuthenticated: true,
            };
            renderLoginPage();

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });
    });

    // ─────────────────────────────────────────────
    describe('Auth 過期處理', () => {
        it('有 authExpiredMessage 時應顯示為 API 錯誤並清除', () => {
            mockAuthValue = {
                ...mockAuthValue,
                authExpiredMessage: '登入已過期，請重新登入',
            };
            renderLoginPage();

            expect(screen.getByText('登入已過期，請重新登入')).toBeInTheDocument();
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
