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
            const style = el.style as CSSStyleDeclaration & Record<string, string | null>;
            if (value === undefined || value === null) {
                style.removeProperty(key);
                if (style[key]) style[key] = '';
            } else if (key.startsWith('--')) {
                style.setProperty(key, String(value));
            } else {
                style[key] = String(value);
            }
        });
    }, [dynamicStyle]);

    return (
        <div ref={ref} className={className} {...props}>
            {children}
        </div>
    );
}
