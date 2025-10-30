import { useRef, useState, useEffect } from "react";
import GlobalState from "../GlobalState";

export default function RotatingCursor() {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const { started } = GlobalState();
    const timeoutRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastPosRef = useRef<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

    // EN: track mouse without causing React re-renders; update position directly
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            if (!ref.current) return;
            ref.current.style.left = `${e.clientX}px`;
            ref.current.style.top = `${e.clientY}px`;
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    // EN: rotate via requestAnimationFrame while visible
    useEffect(() => {
        if (!visible) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            return;
        }
        // ensure initial position from last mouse pose
        if (ref.current) {
            const { x, y } = lastPosRef.current;
            ref.current.style.left = `${x}px`;
            ref.current.style.top = `${y}px`;
        }
        const start = performance.now();
        const loop = () => {
            if (ref.current) {
                const elapsed = performance.now() - start;
                const deg = (elapsed * 0.36) % 360;
                ref.current.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [visible]);

    // EN: when started, hide system cursor for 5 seconds and show spinner overlay
    useEffect(() => {
        if (!started) return;
        document.body.style.cursor = 'none';
        setVisible(true);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            document.body.style.cursor = 'auto';
            timeoutRef.current = null;
            setVisible(false);
        }, 4000);
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setVisible(false);
        };
    }, [started]);

    if (!visible) return null;
    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: 24,
                height: 24,
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                zIndex: 1000,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
}