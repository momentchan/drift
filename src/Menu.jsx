import { Button, IconButton } from '@mui/material';
import SquareOutlinedIcon from '@mui/icons-material/SquareOutlined';
import { SvgIcon } from '@mui/material';
import { useEffect, useState } from 'react';
import GlobalState from './GlobalState';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import SpeakerNotesOffIcon from '@mui/icons-material/SpeakerNotesOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MyLocationIcon from '@mui/icons-material/MyLocation';

function TriangleOutlinedIcon(props) {
    return (
        <SvgIcon {...props}>
            <polygon points="12,3 21,19 3,19" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} />
        </SvgIcon>
    );
}

export default function Menu({ }) {

    const { isTriangle, setIsTriangle, loaded, setLoaded, noted, setNoted, soundOn, setSoundOn, resetPos, setResetPos, isMobile, setIsMobile } = GlobalState();

    useEffect(() => {
        const userAgent = navigator.userAgent;
        const isMobileDevice =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        setIsMobile(isMobileDevice);
    }, [])

    // Adjust styles based on whether the user is on a mobile device
    const commonStyle = {
        backgroundColor: '#555555',
        '&:hover': {
            backgroundColor: '#555555',
            opacity: 0.8
        },
        padding: isMobile ? '0.8' : '1.2', // Adjust padding based on device
        opacity: 0.4,
    };

    const style = {
        fontSize: isMobile ? '18px' : '25px', // Adjust font size based on device
        color: 'white'
    };
    return (
        <div className='container'>
            {/* <div className='overlay'/> */}
            <div className='side-menu'>
                <div>
                    {loaded &&
                        <IconButton
                            onClick={() => setIsTriangle(!isTriangle)}
                            sx={commonStyle}
                        >
                            {isTriangle ? (<TriangleOutlinedIcon sx={style} />) :
                                (<SquareOutlinedIcon sx={style} />)}
                        </IconButton>
                    }
                </div>
                <div>
                    {loaded &&
                        <IconButton
                            onClick={() => setNoted(!noted)}
                            sx={commonStyle}
                        >
                            {noted ? (<SpeakerNotesIcon sx={style} />) :
                                (<SpeakerNotesOffIcon sx={style} />)}
                        </IconButton>
                    }
                </div>

                <div>
                    {loaded &&
                        <IconButton
                            onClick={() => setSoundOn(!soundOn)}
                            sx={commonStyle}
                        >
                            {soundOn ? (<VolumeUpIcon sx={style} />) :
                                (<VolumeOffIcon sx={style} />)}
                        </IconButton>
                    }
                </div>

                <div>
                    {loaded &&
                        <IconButton
                            onClick={() => setResetPos(!resetPos)}
                            sx={commonStyle}
                        >
                            <MyLocationIcon sx={style} />
                        </IconButton>
                    }
                </div>
            </div>

            {!loaded &&
                <div className='entry'>
                    <div className='intro'>
                        <p>Welcome to the digital realm as Captain Alex Reynolds, an astronaut lost in space.</p>
                        <p>Each day, AI-generated diary entries reveal the profound isolation and dwindling hope of returning to Earth.</p>
                        <p>Move your mouse to explore a vast, starry expanse, interact with floating particles, and delve into the captain's thoughts.</p>
                        <p>This isn't just a story—it's a voyage through a living universe that reacts to your every move.</p>
                    </div>
                    <div className='play'>
                        <Button
                            sx={{
                                backgroundColor: '#00000',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#333333',
                                }
                            }}
                            onClick={() => {
                                $(".overlay").fadeOut(5000)
                                setLoaded(true)
                            }}
                        >
                            Start
                        </Button>
                    </div>
                </div>
            }
        </div>
    );
}