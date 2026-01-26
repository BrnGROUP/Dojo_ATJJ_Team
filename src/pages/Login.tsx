
export function Login() {
    return (
        <div className="bg-main min-h-screen flex flex-col font-display text-white">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border-slate bg-card px-10 py-3">
                <div className="flex items-center gap-4 text-white">
                    <div className="size-6 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">ATJJ Dojo v4</h2>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="layout-content-container flex flex-col max-w-[480px] w-full bg-card shadow-xl rounded-xl overflow-hidden border border-border-slate">
                    <div className="relative h-32 bg-primary/10 flex items-center justify-center border-b border-border-slate">
                        <div className="bg-bg-card p-4 rounded-full shadow-sm border border-border-slate">
                            <span className="material-symbols-outlined text-primary text-5xl">sports_kabaddi</span>
                        </div>
                    </div>
                    <div className="p-8">
                        <h1 className="text-white tracking-light text-2xl font-bold leading-tight text-center pb-6">Acesse sua conta</h1>
                        <div className="mb-6 @container">
                            <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-red-400 text-sm font-bold leading-tight">Credenciais inválidas. Por favor, tente novamente.</p>
                                        <p className="text-red-300 text-xs font-normal leading-normal">Verifique seu e-mail e senha e tente novamente.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <form className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="flex flex-col w-full">
                                    <p className="text-muted text-sm font-medium leading-normal pb-1.5">E-mail</p>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl">mail</span>
                                        <input className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-slate bg-main h-12 placeholder:text-muted/50 pl-10 pr-4 text-sm font-normal" placeholder="ex: sensei@atjjdojo.com" type="email" />
                                    </div>
                                </label>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="flex flex-col w-full">
                                    <p className="text-muted text-sm font-medium leading-normal pb-1.5">Senha</p>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl">lock</span>
                                        <input className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-slate bg-main h-12 placeholder:text-muted/50 pl-10 pr-4 text-sm font-normal" placeholder="••••••••" type="password" />
                                    </div>
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <a className="text-primary hover:text-primary-hover text-sm font-medium transition-colors" href="#">Esqueceu sua senha?</a>
                            </div>
                            <div className="pt-4">
                                <button className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary-hover text-white text-base font-bold transition-colors shadow-md" type="submit">
                                    <span className="truncate">Entrar</span>
                                </button>
                            </div>
                        </form>
                        <div className="mt-8 pt-6 border-t border-border-slate text-center">
                            <p className="text-muted text-sm">
                                Novo no Dojo? <a className="text-primary font-semibold hover:underline" href="#">Entre em contato com a administração</a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="py-6 text-center text-muted text-xs">
                © 2024 ATJJ Dojo v4 Sistema de Gestão. Todos os direitos reservados.
            </footer>
        </div>
    );
}
