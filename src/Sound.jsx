import React, { useEffect, useRef } from 'react';
import { Audio, AudioLoader } from 'three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalState from './GlobalState';


export default function Sound() {
    const { camera } = useThree();
    const { started, soundOn, audioUrl, noted } = GlobalState();
    const listener = useRef(new THREE.AudioListener()).current;

    const bgmData = [
        { file: 'space.mp3', volume: 0.15, delay: 0 },
        { file: 'noise.wav', volume: 0.25, delay: 0 },
    ];
    
    const radioData = [
        { file: 'radio01.wav', volume: 0.02, delay: 2000 },
        // { file: 'radio02.mp3', volume: 0.02, delay: 2000 },
        // { file: '338070__zbylut__160225_iss_3.mp3', volume: 0.02, delay: 2000 }
    ];

    function fadeIn(audio, targetVolume = 0.02, delay = 0, fadeDuration = 3000, intervalTime = 50) {
        if (!audio || !(audio instanceof THREE.Audio)) {
            console.error('Invalid audio object');
            return;
        }

        // Ensure the audio starts with volume 0
        audio.setVolume(0);

        // Delay the start of the fade-in
        setTimeout(() => {
            audio.play(); // Play the sound after the delay

            // Calculate the volume increment
            const volumeIncrement = targetVolume / (fadeDuration / intervalTime);

            const fadeInterval = setInterval(() => {
                const currentVolume = audio.getVolume();
                if (currentVolume < targetVolume) {
                    audio.setVolume(Math.min(currentVolume + volumeIncrement, targetVolume));
                } else {
                    clearInterval(fadeInterval); // Stop the interval when the target volume is reached
                }
            }, intervalTime);
        }, delay);
    }

    useEffect(() => {
        if (audioUrl && noted) {
            const audio = new THREE.Audio(listener);

            const audioLoader = new THREE.AudioLoader();
            audioLoader.load(audioUrl, (buffer) => {
                audio.setBuffer(buffer);
                audio.setLoop(false);
                audio.setVolume(0.5);
                if (noted) {
                    audio.play();
                }
            });

            // Cleanup the specific audio when `audioUrl` or `noted` changes
            return () => {
                if (audio.isPlaying) {
                    audio.stop();
                }
            };
        }
    }, [audioUrl, noted]);

    useEffect(() => {
        if (!noted && started && soundOn) {
            const audio = new THREE.Audio(listener);

            const audioLoader = new THREE.AudioLoader();
            const data = radioData[Math.floor(Math.random() * radioData.length)];

            audioLoader.load(data.file, (buffer) => {
                audio.setBuffer(buffer);
                audio.setLoop(true);
                fadeIn(audio, data.volume, data.delay)
            });
            return () => {
                if (audio.isPlaying) {
                    audio.stop();
                }
            };
        }
    }, [started, soundOn, noted])

    useEffect(() => {
        if (started && soundOn) {
            camera.add(listener);

            const bgms = []

            bgmData.forEach((data, index) => {
                // Create a global audio source for each sound
                const sound = new THREE.Audio(listener);
                bgms.push(sound);

                // Load the audio file and set it as the audio source buffer
                const audioLoader = new THREE.AudioLoader();
                audioLoader.load(data.file, (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setLoop(true);
                    sound.setVolume(data.volume);
                    sound.play(data.delay);
                });
            });

            // Cleanup on unmount
            return () => {
                bgms.forEach((sound) => {
                    if (sound.isPlaying) {
                        sound.stop(); // Stop each sound
                    }
                });
            };
        }
    }, [started, soundOn]);

    return null;
}