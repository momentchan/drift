import React, { useEffect, useRef } from 'react';
import { Audio, AudioLoader } from 'three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalState from './GlobalState';

export default function Sound() {
    const { camera } = useThree();

    const bgmRefs = useRef([]);

    const { started, soundOn, noted } = GlobalState();
    const listener = useRef(new THREE.AudioListener()).current;

    // Define sound files to play
    const soundData = [
        { file: 'space.mp3', volume: 0.15, delay: 0, signal: false },
        { file: 'noise.wav', volume: 0.25, delay: 0, signal: false },
        { file: '338070__zbylut__160225_iss_3.mp3', volume: 0.03, delay: 3, signal: true }
    ];

    useEffect(() => {
        if (started) {
            camera.add(listener);

            soundData.forEach(data => {
                const audio = new THREE.Audio(listener);
                const audioLoader = new THREE.AudioLoader();
                audioLoader.load(data.file, (buffer) => {
                    audio.setBuffer(buffer);
                    audio.setLoop(true);
                    audio.setVolume(data.volume);
                    audio.play(data.delay);
                });

                bgmRefs.current.push({ audio: audio, data: data });
            });

            // Cleanup on unmount
            return () => {
                bgmRefs.current.forEach((bgm) => {
                    bgm.audio.stop(); // Stop each sound
                });
            };
        }
    }, [started]);

    useEffect(() => {
        if (bgmRefs.current.length > 0) {
            bgmRefs.current.forEach((bgm) => {
                if (soundOn) {
                    if (!bgm.data.signal || (bgm.data.signal && !noted))
                        bgm.audio.play(bgm.data.delay);
                } else {
                    bgm.audio.stop();
                }
            });
        }
    }, [soundOn]);


    useEffect(() => {
        if (bgmRefs.current.length > 0) {
            bgmRefs.current.forEach((bgm) => {
                if (bgm.data.signal) {
                    if (noted) {
                        bgm.audio.stop();
                    } else if (soundOn) {
                        bgm.audio.play(bgm.data.delay);
                    }
                }
            });
        }
    }, [noted])

    return null;
}