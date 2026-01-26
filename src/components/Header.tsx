export function Header() {
    return (
        <header className="h-18 flex items-center justify-between bg-main/95 backdrop-blur-md border-b border-border-slate px-10 sticky top-0 z-30 py-4">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">search</span>
                    <input className="w-full bg-card border border-border-slate rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted/50" placeholder="Pesquisar por alunos, graduações..." type="text" />
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-2">
                    <button className="p-2 text-muted hover:text-white hover:bg-card rounded-xl transition-all relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-main shadow-[0_0_8px_#d72638]"></span>
                    </button>
                    <button className="p-2 text-muted hover:text-white hover:bg-card rounded-xl transition-all">
                        <span className="material-symbols-outlined">chat_bubble</span>
                    </button>
                </div>
                <div className="h-8 w-px bg-border-slate"></div>
                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="text-right">
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Mestre Silva</p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Administrador</p>
                    </div>
                    <img alt="User" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-border-slate" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdR_rYip1JZqYRefkGQm9GaJKZ8Cad7hdhZi9sZLamFJ0Of7VDRtVr_Z64DLoev5KIDFC_uLK043WEHDXLzkeueFp-LzM1pYN88kEckc4Mlnybnwox1ZUX6NNDCGbkMs31YankLnAWYfcAwjVOiKgs-b_W6crglye3QdBdqeHsy0YN5YPGxYHnpKwoE1uqnerCu-Sqjmod8kN3jx6NtH_X8o5wRRKsZrQxloBylC4eReqXl5aZLydCDMhg6eOkYYUG2IQhlcpiBHis" />
                </div>
            </div>
        </header>
    );
}
