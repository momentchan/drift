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
import ShareIcon from '@mui/icons-material/Share';
import html2canvas from 'html2canvas';

function TriangleOutlinedIcon(props) {
    return (
        <SvgIcon {...props}>
            <polygon points="12,3 21,19 3,19" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} />
        </SvgIcon>
    );
}

export default function Menu({ }) {

    const { isTriangle, setIsTriangle, started, setStarted, noted, setNoted, soundOn, setSoundOn, resetPos, setResetPos, isMobile, setIsMobile } = GlobalState();

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


    async function Share(name = 'Screenshot.png') {
        try {
            const rootElement = document.getElementById('root');
            const width = Math.round(rootElement.clientWidth);
            const height = Math.round(rootElement.clientHeight);
            const canvas = await html2canvas(rootElement, {
                ignoreElements: function (element) {
                    if (element.classList.contains('container')) {
                        return true;
                    }
                },
                width: width,
                height: height,
                backgroundColor: null,
            })

            // Convert the final canvas to a data URL
            const dataUrl = canvas.toDataURL('image/png');
            const blob = await fetch(dataUrl).then(res => res.blob());
            const file = new File([blob], name, { type: 'image/png' });

            // Check if the Web Share API is supported and share the file
            if (navigator.share) {
                await navigator.share({
                    files: [file],
                });
                console.log('Canvas shared successfully!');
            } else {
                console.log('Web Share API not supported in this browser.');
            }
        } catch (error) {
            console.error('Error sharing canvas:', error);
        }
    }


    return (
        <div className='container'>
            {/* <div className='overlay'/> */}
            <div className='side-menu'>
                <div>
                    {started &&
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
                    {started &&
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
                    {started &&
                        <IconButton
                            onClick={() => setResetPos(!resetPos)}
                            sx={commonStyle}
                        >
                            <MyLocationIcon sx={style} />
                        </IconButton>
                    }
                </div>

                <div>
                    {started &&
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
                    {started && isMobile &&
                        <IconButton
                            onClick={() => Share()}
                            sx={commonStyle}
                        >
                            <ShareIcon sx={style} />
                        </IconButton>
                    }
                </div>
            </div>

            {!started &&
                <div className='entry'>
                    <div className='title'>
                        DRIFT
                    </div>
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
                                setStarted(true)
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