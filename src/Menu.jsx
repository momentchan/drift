import { IconButton } from '@mui/material';
import SquareOutlinedIcon from '@mui/icons-material/SquareOutlined';
import { SvgIcon } from '@mui/material';
import { useState } from 'react';
import GlobalState from './GlobalState';

function TriangleOutlinedIcon(props) {
    return (
        <SvgIcon {...props}>
            <polygon points="12,4 21,19 3,19" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} />
        </SvgIcon>
    );
}

export default function Menu({ }) {

    const { isTriangle, setIsTriangle } = GlobalState();

    const handleClick = () => {
        setIsTriangle(!isTriangle);
    };

    return (
        <div className="menu">
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
                {isTriangle ? (
                    <TriangleOutlinedIcon sx={{ fontSize: 25, color: 'white' }} />
                ) : (
                    <SquareOutlinedIcon sx={{ fontSize: 25, color: 'white' }} />
                )}
            </IconButton>
        </div>
    );
}