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

    const { isTriangle, setIsTriangle, loaded, setLoaded, noted, setNoted, soundOn, setSoundOn, resetPos, setResetPos } = GlobalState();

    const commonStyle = {
        backgroundColor: '#555555',
        '&:hover': {
            backgroundColor: '#555555',
            opacity: 0.8
        },
        padding: 1.2,
        opacity: 0.4,
    }

    const style = { fontSize: 25, color: 'white' }

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

            <div className='play'>
                {!loaded &&
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
                }
            </div>
        </div>
    );
}