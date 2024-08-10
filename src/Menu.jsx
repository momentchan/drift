import { Button, IconButton } from '@mui/material';
import SquareOutlinedIcon from '@mui/icons-material/SquareOutlined';
import { SvgIcon } from '@mui/material';
import { useEffect, useState } from 'react';
import GlobalState from './GlobalState';

function TriangleOutlinedIcon(props) {
    return (
        <SvgIcon {...props}>
            <polygon points="12,3 21,19 3,19" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} />
        </SvgIcon>
    );
}

export default function Menu({ }) {

    const { isTriangle, setIsTriangle, loaded, setLoaded } = GlobalState();

    const handleClick = () => {
        setIsTriangle(!isTriangle);
    };

    return (
        <div className='container'>
            {/* <div className='overlay'/> */}
            <div className="selection">
                {loaded &&
                    <IconButton
                        onClick={handleClick}
                        sx={{
                            backgroundColor: '#555555',
                            '&:hover': {
                                backgroundColor: '#555555',
                                opacity: 0.8
                            },
                            padding: 1.2,
                            opacity: 0.4,
                        }}
                    >
                        {isTriangle ? (<TriangleOutlinedIcon sx={{ fontSize: 25, color: 'white' }} />) :
                            (<SquareOutlinedIcon sx={{ fontSize: 25, color: 'white' }} />)}
                    </IconButton>
                }
            </div>

            <div className='play'>
                {!loaded &&
                    <Button
                        sx={{
                            backgroundColor: '#00000',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#222222', 
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