import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';

// ── Mock react-router-dom navigate ──
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// ── Mock useAuth ──
const mockLogout = vi.fn();
let mockAuthValue: {
    user: { username: string; role: 'admin' | 'user' } | null;
    logout: typeof mockLogout;
} = {
    user: { username: 'dean', role: 'admin' },
    logout: mockLogout,
};

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockAuthValue,
}));

// ── Mock productApi ──
const mockGetProducts = vi.fn();
vi.mock('../../api/productApi', () => ({
    productApi: {
        getProducts: (...args: unknown[]) => mockGetProducts(...args),
    },
}));

const mockProducts = [
    { id: 1, name: '筆記型電腦', price: 25000, description: '輕薄高效能筆記型電腦，適合工作與娛樂' },
    { id: 2, name: '無線滑鼠', price: 890, description: '人體工學設計，支援多裝置連接' },
    { id: 3, name: '機械鍵盤', price: 3200, description: '青軸機械鍵盤，打字手感極佳' },
];

// ── Helpers ──
const renderDashboardPage = () =>
    render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>,
    );

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthValue = {
            user: { username: 'dean', role: 'admin' },
            logout: mockLogout,
        };
        mockGetProducts.mockResolvedValue(mockProducts);
    });

    // ─────────────────────────────────────────────
    describe('前端元素', () => {
        it('應正確渲染儀表板頁面標題', () => {
            renderDashboardPage();

            expect(screen.getByText('儀表板')).toBeInTheDocument();
        });

        it('應顯示歡迎訊息與使用者名稱', async () => {
            renderDashboardPage();

            expect(screen.getByText('Welcome, dean 👋')).toBeInTheDocument();
        });

        it('應顯示使用者頭像首字母大寫', () => {
            renderDashboardPage();

            expect(screen.getByText('D')).toBeInTheDocument();
        });

        it('應顯示登出按鈕', () => {
            renderDashboardPage();

            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
        });

        it('應顯示商品列表標題', () => {
            renderDashboardPage();

            expect(screen.getByText('商品列表')).toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────
    describe('權限顯示', () => {
        it('admin 角色應顯示「管理員」標籤和管理後台連結', () => {
            renderDashboardPage();

            expect(screen.getByText('管理員')).toBeInTheDocument();
            const adminLink = screen.getByText('🛠️ 管理後台');
            expect(adminLink.closest('a')).toHaveAttribute('href', '/admin');
        });

        it('user 角色應顯示「一般用戶」標籤且不顯示管理後台連結', () => {
            mockAuthValue = {
                ...mockAuthValue,
                user: { username: 'dean', role: 'user' },
            };
            renderDashboardPage();

            expect(screen.getByText('一般用戶')).toBeInTheDocument();
            expect(screen.queryByText('🛠️ 管理後台')).not.toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────
    describe('Mock API', () => {
        it('載入中應顯示 loading 狀態', () => {
            // 讓 API 永遠不 resolve
            mockGetProducts.mockImplementation(() => new Promise(() => {}));
            renderDashboardPage();

            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
        });

        it('載入成功應顯示商品卡片', async () => {
            renderDashboardPage();

            await waitFor(() => {
                expect(screen.getByText('筆記型電腦')).toBeInTheDocument();
            });
            expect(screen.getByText('無線滑鼠')).toBeInTheDocument();
            expect(screen.getByText('機械鍵盤')).toBeInTheDocument();
            expect(screen.getByText('NT$ 25,000')).toBeInTheDocument();
            expect(screen.getByText('NT$ 890')).toBeInTheDocument();
            expect(screen.getByText('NT$ 3,200')).toBeInTheDocument();
            expect(screen.getByText('輕薄高效能筆記型電腦，適合工作與娛樂')).toBeInTheDocument();
        });

        it('載入失敗應顯示 API 錯誤訊息', async () => {
            mockGetProducts.mockRejectedValueOnce({
                response: { status: 500, data: { message: '伺服器錯誤，請稍後再試' } },
            });
            renderDashboardPage();

            await waitFor(() => {
                expect(screen.getByText('伺服器錯誤，請稍後再試')).toBeInTheDocument();
            });
        });

        it('載入失敗且無 message 時應顯示預設錯誤訊息', async () => {
            mockGetProducts.mockRejectedValueOnce({
                response: { status: 500, data: {} },
            });
            renderDashboardPage();

            await waitFor(() => {
                expect(screen.getByText('無法載入商品資料')).toBeInTheDocument();
            });
        });
    });

    // ─────────────────────────────────────────────
    describe('使用者互動', () => {
        it('點擊登出按鈕應呼叫 logout 並導航到 /login', async () => {
            const user = userEvent.setup();
            renderDashboardPage();

            await user.click(screen.getByRole('button', { name: '登出' }));

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
