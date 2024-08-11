import React, { useEffect, useRef } from 'react';
import { Audio, AudioLoader } from 'three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalState from './GlobalState';


export default function Sound() {
    const { camera } = useThree();
    const audioRefs = useRef([]);
    const { loaded } = GlobalState();

    useEffect(() => {
        if (loaded) {
            // Create an audio listener and add it to the camera
            const listener = new THREE.AudioListener();
            camera.add(listener);

            // Define sound files to play
            const soundData = [
                { file: 'space.mp3', volume: 0.2 },
                { file: 'noise.wav', volume: 0.5 }
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

    return null;

}