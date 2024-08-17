import React, { useEffect, useRef } from 'react';
import { Audio, AudioLoader } from 'three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalState from './GlobalState';


export default function Sound() {
    const { camera } = useThree();
    const audioRefs = useRef([]);
    const { loaded, soundOn, audioUrl, noted } = GlobalState();
    const listener = useRef(new THREE.AudioListener()).current;

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
                    audioRefs.current.remo
                }
            };
        }
    }, [noted]);

    useEffect(() => {
        if (loaded) {
            camera.add(listener);

            // Define sound files to play
            const soundData = [
                { file: 'space.mp3', volume: 0.15 },
                { file: 'noise.wav', volume: 0.25 },
                { file: '617633__w1zy__42819_2_cut.mp3', volume: 0.1 }
            ];

            soundData.forEach((soundInfo, index) => {
                // Create a global audio source for each sound
                const sound = new THREE.Audio(listener);
                audioRefs.current.push(sound);

                // Load the audio file and set it as the audio source buffer
                const audioLoader = new THREE.AudioLoader();
                audioLoader.load(soundInfo.file, (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setLoop(true); // Set loop if needed
                    sound.setVolume(soundInfo.volume); // Set individual volume
                    sound.play(); // Play the sound
                });
            });

            // Cleanup on unmount
            return () => {
                audioRefs.current.forEach((sound) => {
                    if (sound.isPlaying) {
                        sound.stop(); // Stop each sound
                    }
                });
            };
        }
    }, [loaded]);

    useEffect(() => {
        if (audioRefs.current.length > 0) {
            audioRefs.current.forEach((sound) => {
                if (soundOn) {
                    if (!sound.isPlaying) {
                        sound.play(); // Play the sound if soundOn is true
                    }
                } else {
                    if (sound.isPlaying) {
                        sound.stop(); // Stop the sound if soundOn is false
                    }
                }
            });
        }
    }, [soundOn]);

    return null;
}