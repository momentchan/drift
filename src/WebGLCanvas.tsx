'use client';

import React, { useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';
import { Perf } from 'r3f-perf';

// WebGL detection utility
const isWebGLAvailable = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch {
        return false;
    }
};

// Style constants
const loadingStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    color: '#ffffff'
};

const errorStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    color: '#ffffff',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
    textAlign: 'center'
};

interface WebGLCanvasProps {
    children: ReactNode;
    gl?: any;
    frameloop?: 'always' | 'demand' | 'never';
    shadows?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onCreated?: (state: any) => void;
    onError?: (error: any) => void;
    fallback?: ReactNode;
    loadingComponent?: ReactNode;
    errorComponent?: ReactNode;
    forceLoading?: boolean;
    forceError?: boolean;
}

export default function WebGLCanvas({
    children,
    gl = {},
    frameloop = 'always',
    shadows = false,
    className,
    style,
    onCreated,
    onError,
    fallback,
    loadingComponent,
    errorComponent,
    forceLoading = false,
    forceError = false,
    ...props
}: WebGLCanvasProps) {
    // Initial DPR value
    const initialDPR = 1;

    // State management
    const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
    const [hasError, setHasError] = useState(false);
    const [adaptiveDPR, setAdaptiveDPR] = useState(initialDPR);

    // Performance monitoring refs
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const lastDPRChangeRef = useRef(0);
    const consecutiveLowFPSRef = useRef(0);
    const consecutiveHighFPSRef = useRef(0);
    const dprRef = useRef(initialDPR);

    // Adaptive DPR controls
    const perfControls = useControls('Performance', {
        showPerf: { value: false, label: 'Show Performance Monitor' },
        enableAdaptiveDRP: { value: true, label: 'Enable Adaptive DPR' },
        targetFPS: { value: 30, min: 30, max: 60, step: 5, label: 'Target FPS' },
        minDPR: { value: 1, min: 0.25, max: 1, step: 0.25, label: 'Min DPR' },
        maxDPR: { value: 2, min: 1, max: 3, step: 0.25, label: 'Max DPR' }
    }, { collapsed: true });

    // Initialize WebGL availability check
    useEffect(() => {
        setWebglAvailable(isWebGLAvailable());
    }, []);

    // Adaptive DPR adjustment logic
    const adjustDPR = useCallback((fps: number, currentTime: number) => {
        const timeSinceLastChange = currentTime - lastDPRChangeRef.current;

        if (timeSinceLastChange < 3000) return; // Cooldown period

        if (fps < perfControls.targetFPS - 5) {
            // Performance is poor, reduce DPR
            consecutiveLowFPSRef.current++;
            consecutiveHighFPSRef.current = 0;

            if (consecutiveLowFPSRef.current >= 1 && dprRef.current > perfControls.minDPR) {
                const newDPR = Math.max(perfControls.minDPR, dprRef.current - 0.25);
                dprRef.current = newDPR;
                setAdaptiveDPR(newDPR);
                lastDPRChangeRef.current = currentTime;
            }
        } else if (fps > perfControls.targetFPS + 15) {
            // Performance is good, increase DPR
            consecutiveHighFPSRef.current++;
            consecutiveLowFPSRef.current = 0;

            if (consecutiveHighFPSRef.current >= 2 && dprRef.current < perfControls.maxDPR) {
                const newDPR = Math.min(perfControls.maxDPR, dprRef.current + 0.25);
                dprRef.current = newDPR;
                setAdaptiveDPR(newDPR);
                lastDPRChangeRef.current = currentTime;
            }
        } else {
            // FPS is in acceptable range, reset counters
            consecutiveLowFPSRef.current = 0;
            consecutiveHighFPSRef.current = 0;
        }
    }, [perfControls.targetFPS, perfControls.minDPR, perfControls.maxDPR]);

    // FPS monitoring and adaptive DPR
    useEffect(() => {
        if (!webglAvailable || !perfControls.enableAdaptiveDRP) return;

        const monitorFPS = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTimeRef.current;
            frameCountRef.current++;

            if (deltaTime >= 2000) {
                const fps = (frameCountRef.current * 1000) / deltaTime;
                adjustDPR(fps, currentTime);

                frameCountRef.current = 0;
                lastTimeRef.current = currentTime;
            }

            requestAnimationFrame(monitorFPS);
        };

        const animationId = requestAnimationFrame(monitorFPS);
        return () => cancelAnimationFrame(animationId);
    }, [webglAvailable, perfControls.enableAdaptiveDRP, adjustDPR]);

    // useEffect(() => {
    //     console.log('adaptiveDPR', adaptiveDPR);
    // }, [adaptiveDPR]);

    // Canvas configuration
    const canvasConfig = {
        shadows,
        dpr: adaptiveDPR,
        gl: {
            shadowMapType: THREE.PCFSoftShadowMap,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance" as const,
            ...gl
        },
        frameloop,
        className,
        style,
        onCreated: (state: any) => {
            if (state.gl) {
                state.gl.setClearColor('#000000');
            }

            // Suppress WebGL warnings
            const originalError = console.error;
            console.error = function (...args) {
                if (args[0] && typeof args[0] === 'string' && args[0].includes('WebGL')) {
                    return;
                }
                originalError.apply(console, args);
            };

            onCreated?.(state);
        },
        onError: (error: any) => {
            console.warn('Canvas error handled:', error);
            setHasError(true);
            onError?.(error);
        },
        ...props
    };

    // Loading state
    if (webglAvailable === null || forceLoading) {
        return loadingComponent ? <>{loadingComponent}</> : (
            <div className={className} style={{ ...style, ...loadingStyles }}>
                <div>Loading...</div>
            </div>
        );
    }

    // Error state
    if (!webglAvailable || hasError || forceError) {
        if (fallback) return <>{fallback}</>;
        if (errorComponent) return <>{errorComponent}</>;

        return (
            <div className={className} style={{ ...style, ...errorStyles }}>
                <div>WebGL is not available</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    This experience requires WebGL support. Please enable WebGL in your browser settings or try a different browser.
                </div>
            </div>
        );
    }

    return <Canvas {...canvasConfig}>
        {children}
        {perfControls.showPerf && <Perf />}
    </Canvas>;
}
