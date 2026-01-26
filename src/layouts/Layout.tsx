import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export function Layout() {
    return (
        <div className="flex h-screen overflow-hidden bg-main">
            <Sidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden bg-main">
                <Header />
                <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
