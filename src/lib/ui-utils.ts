
export const getBeltColor = (belt: string) => {
    const b = belt?.toLowerCase() || '';
    if (b.includes('azul')) return 'text-blue-500';
    if (b.includes('roxa')) return 'text-purple-500';
    if (b.includes('marrom')) return 'text-amber-700';
    if (b.includes('preta')) return 'text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]';
    if (b.includes('cinza')) return 'text-slate-400';
    if (b.includes('amarela')) return 'text-yellow-400';
    if (b.includes('laranja')) return 'text-orange-500';
    if (b.includes('verde')) return 'text-green-500';
    return 'text-slate-200';
};

export const getBeltBg = (belt: string) => {
    const b = belt?.toLowerCase() || '';
    if (b.includes('branca')) return 'bg-white';
    if (b.includes('azul')) return 'bg-blue-600';
    if (b.includes('roxa')) return 'bg-purple-600';
    if (b.includes('marrom')) return 'bg-[#422e25]';
    if (b.includes('preta')) return 'bg-black border-red-600 border-r-4';
    if (b.includes('cinza')) return 'bg-slate-500';
    if (b.includes('amarela')) return 'bg-yellow-400';
    if (b.includes('laranja')) return 'bg-orange-500';
    if (b.includes('verde')) return 'bg-green-600';
    return 'bg-slate-200';
};

export const getBeltGlow = (belt: string) => {
    const b = belt?.toLowerCase() || '';
    if (b.includes('azul')) return 'shadow-[0_0_15px_rgba(37,99,235,0.3)]';
    if (b.includes('roxa')) return 'shadow-[0_0_15px_rgba(147,51,234,0.3)]';
    if (b.includes('marrom')) return 'shadow-[0_0_15px_rgba(66,46,37,0.3)]';
    if (b.includes('preta')) return 'shadow-[0_0_20px_rgba(0,0,0,0.5)]';
    if (b.includes('amarela')) return 'shadow-[0_0_15px_rgba(250,204,21,0.3)]';
    if (b.includes('verde')) return 'shadow-[0_0_15px_rgba(22,163,74,0.3)]';
    return '';
};

export const getInitials = (name: string) => {
    if (!name) return '??';
    return name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};
