import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from '../AdminPage';

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

// ── Helpers ──
const renderAdminPage = () =>
    render(
        <MemoryRouter>
            <AdminPage />
        </MemoryRouter>,
    );

describe('AdminPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthValue = {
            user: { username: 'dean', role: 'admin' },
            logout: mockLogout,
        };
    });

    // ─────────────────────────────────────────────
    describe('前端元素', () => {
        it('應正確渲染管理後台頁面標題與返回連結', () => {
            renderAdminPage();

            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
            const backLink = screen.getByText('← 返回');
            expect(backLink).toBeInTheDocument();
            expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
        });

        it('應顯示管理員專屬頁面說明區塊', () => {
            renderAdminPage();

            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
            expect(screen.getByText('只有 admin 角色可以訪問')).toBeInTheDocument();
            expect(screen.getByText('user 角色會被重定向')).toBeInTheDocument();
            expect(screen.getByText('受路由守衛保護')).toBeInTheDocument();
        });

        it('應顯示登出按鈕', () => {
            renderAdminPage();

            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────
    describe('權限顯示', () => {
        it('admin 角色應顯示「管理員」角色標籤', () => {
            mockAuthValue = {
                ...mockAuthValue,
                user: { username: 'dean', role: 'admin' },
            };
            renderAdminPage();

            expect(screen.getByText('管理員')).toBeInTheDocument();
        });

        it('user 角色應顯示「一般用戶」角色標籤', () => {
            mockAuthValue = {
                ...mockAuthValue,
                user: { username: 'dean', role: 'user' },
            };
            renderAdminPage();

            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────
    describe('使用者互動', () => {
        it('點擊登出按鈕應呼叫 logout 並導航到 /login', async () => {
            const user = userEvent.setup();
            renderAdminPage();

            await user.click(screen.getByRole('button', { name: '登出' }));

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
