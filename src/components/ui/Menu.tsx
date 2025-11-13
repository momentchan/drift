import { Button, IconButton, SvgIcon } from '@mui/material';
import SquareOutlinedIcon from '@mui/icons-material/SquareOutlined';
import { useEffect, useRef } from 'react';
import GlobalState from '../GlobalState';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import SpeakerNotesOffIcon from '@mui/icons-material/SpeakerNotesOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ShareIcon from '@mui/icons-material/Share';
import html2canvas from 'html2canvas';
import { useProgress } from '@react-three/drei';
import { useLoadedFileCount } from '../../hooks/useLoadedFileCount';

interface TriangleOutlinedIconProps {
  sx?: Record<string, string | number>;
}

function TriangleOutlinedIcon(props: TriangleOutlinedIconProps) {
  return (
    <SvgIcon {...props}>
      <polygon points="12,3 21,19 3,19" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} />
    </SvgIcon>
  );
}

export default function Menu() {
  const { progress } = useProgress();
  const { count, loaded } = useLoadedFileCount(12);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = loaded;
  }, [loaded]);



  const { isTriangle, setIsTriangle, started, setStarted, noted, setNoted, soundOn, setSoundOn, resetPos, setResetPos, isMobile, setIsMobile } = GlobalState();

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(isMobileDevice);
  }, [setIsMobile]);

  // Adjust styles based on whether the user is on a mobile device
  const commonStyle = {
    backgroundColor: '#555555',
    '&:hover': {
      backgroundColor: '#555555',
      opacity: 0.8
    },
    padding: isMobile ? '0.8' : '1.2', // Adjust padding based on device
    opacity: 0.4,
  } as const;

  const style = {
    fontSize: isMobile ? '18px' : '25px', // Adjust font size based on device
    color: 'white'
  } as const;

  function playClickSound(id: number): void {
    const source = ['audio/click01.mp3', 'audio/click02.mp3'];

    const audio = new Audio(source[id]);
    audio.volume = 0.5;
    audio.play();
  }

  async function Share(name: string = 'Screenshot.png'): Promise<void> {
    try {
      const rootElement = document.getElementById('root');
      if (!rootElement) return;

      const width = Math.round(rootElement.clientWidth);
      const height = Math.round(rootElement.clientHeight);
      const canvas = await html2canvas(rootElement, {
        // The built-in html2canvas types may not include ignoreElements in some versions
        // Cast options to any to allow this predicate option
        ignoreElements: function (element: HTMLElement) {
          if (element.classList.contains('container')) {
            return true;
          }
          return false;
        },
        width: width,
        height: height,
        backgroundColor: null,
      } as any);

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
    <>
      {/* <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          background: '#171717',
          fontSize: 20,
          opacity: loadedRef.current ? 0 : 1,
          transition: 'opacity 0.8s ease',
          pointerEvents: loadedRef.current ? 'none' : 'auto'
        }}
      >
        Loading… {Math.round(progress)}%
      </div> */}


      <div className='container'>
        {/* <div className='overlay'/> */}
        <div className='side-menu'>
          <div>
            {started &&
              <IconButton
                onClick={() => {
                  setIsTriangle(!isTriangle);
                  playClickSound(1);
                }}
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
                onClick={() => {
                  setResetPos(!resetPos);
                  playClickSound(0);
                }}
                sx={commonStyle}
              >
                <MyLocationIcon sx={style} />
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
                onClick={() => setSoundOn(!soundOn)}
                sx={commonStyle}
              >
                {soundOn ? (<VolumeUpIcon sx={style} />) :
                  (<VolumeOffIcon sx={style} />)}
              </IconButton>
            }
          </div>

          {/* <div>
            {started && isMobile &&
              <IconButton
                onClick={() => Share()}
                sx={commonStyle}
              >
                <ShareIcon sx={style} />
              </IconButton>
            }
          </div> */}
        </div>

        {!started &&
          <div className='entry' style={{ opacity: loadedRef.current ? 1 : 0, transition: 'opacity 2s ease' }}>
            <div className='title'>
              DRIFT
            </div>
            <div className='intro'>
              <p>Step into the shoes of Captain Alex Reynolds, an astronaut adrift in the vastness of space.</p>
              <p>Each day, you'll uncover AI-generated diary entries that delve into the depths of isolation and the fading dream of returning home.</p>
              <p>Navigate a sprawling, starry void with your mouse, interact with drifting particles, and immerse yourself in the captain's reflections.</p>
              <p>This experience goes beyond storytelling—it's a dynamic journey through a living cosmos that responds to your every move.</p>
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
                  setStarted(true);
                  playClickSound(0);
                }}
              >
                Start
              </Button>
            </div>
          </div>
        }
      </div>
    </>
  );
}


