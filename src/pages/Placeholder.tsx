export function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
            <div className="p-4 bg-accent/10 rounded-full">
                <span className="material-symbols-outlined text-4xl text-accent">construction</span>
            </div>
            <h1 className="text-2xl font-bold text-white max-w-md">{title}</h1>
            <p className="text-muted text-sm">Esta funcionalidade está sendo migrada do protótipo.</p>
        </div>
    );
}
