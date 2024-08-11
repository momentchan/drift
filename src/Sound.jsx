import React, { useEffect, useRef } from 'react';
import { Audio, AudioLoader } from 'three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalState from './GlobalState';


export default function Sound() {
    const { camera } = useThree();
    const audioRef = useRef();
    const { loaded } = GlobalState();

    useEffect(() => {
        if (loaded) {
            // Create an audio listener and add it to the camera
            const listener = new THREE.AudioListener();
            camera.add(listener);

            // Create a global audio source
            const sound = new Audio(listener);
            audioRef.current = sound;

            // Load the audio file and set it as the audio source buffer
            const audioLoader = new AudioLoader();
            audioLoader.load('space.mp3', (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(true); // Loop the audio
                sound.setVolume(0.5); // Set the volume
                sound.play(); // Play the audio
            });

            // Cleanup on unmount
            return () => {
                if (audioRef.current) {
                    audioRef.current.stop();
                }
            };
        }
    }, [loaded]);

    return null;

}