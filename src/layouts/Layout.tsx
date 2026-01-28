import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Toaster } from 'react-hot-toast';

export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col relative overflow-hidden bg-main">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
