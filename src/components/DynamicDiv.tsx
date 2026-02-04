import { useEffect, useRef, type HTMLAttributes, type CSSProperties } from 'react';

interface DynamicDivProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    dynamicStyle?: CSSProperties & Record<string, string | number | undefined | null>;
}

export function DynamicDiv({ dynamicStyle, className, children, ...props }: DynamicDivProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !dynamicStyle) return;

        Object.entries(dynamicStyle).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                // Try to remove both property formats
                el.style.removeProperty(key);
                if ((el.style as any)[key]) (el.style as any)[key] = '';
            } else if (key.startsWith('--')) {
                el.style.setProperty(key, String(value));
            } else {
                (el.style as any)[key] = value;
            }
        });
    }, [dynamicStyle]);

    return (
        <div ref={ref} className={className} {...props}>
            {children}
        </div>
    );
}
