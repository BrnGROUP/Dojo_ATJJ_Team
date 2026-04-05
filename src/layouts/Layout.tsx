import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Toaster } from 'react-hot-toast';

export function Layout() {
    // true = sidebar open (overlay on mobile / wide on widescreen)
    // On widescreen (≥1580px), sidebar is always open and static
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // collapsed = icon-only mode for medium screens (768px–1579px)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const isWidescreen = () => window.innerWidth >= 1580;
    const isMobile = () => window.innerWidth < 768;

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            
            if (width >= 1580) {
                // Large screens: Sidebar always open and full labels
                setSidebarOpen(true);
                setSidebarCollapsed(false);
            } else if (width >= 768) {
                // Medium screens (Tablet/Smaller Desktop): Sidebar always open but icon-only by default
                setSidebarOpen(true); // Ensure it's visible (static)
                setSidebarCollapsed(true);
            } else {
                // Mobile: Sidebar starts closed (overlay mode)
                setSidebarOpen(false);
                setSidebarCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMenuClick = () => {
        if (isWidescreen()) {
            // On widescreen, toggle collapse (icon-only vs full)
            setSidebarCollapsed(prev => !prev);
        } else if (isMobile()) {
            // On mobile, toggle full overlay
            setSidebarOpen(prev => !prev);
        } else {
            // Medium screens (768–1579px): toggle icon-only collapsed state
            setSidebarCollapsed(prev => !prev);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-main">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #444',
                    },
                    success: {
                        iconTheme: {
                            primary: '#d72638',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Sidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col relative overflow-hidden bg-main min-w-0">
                <Header onMenuClick={handleMenuClick} />
                <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
