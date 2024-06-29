import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import TopBarImg from '../assets/img/F_bb.png';
import Logo from '../assets/img/my-site-logo.png';


function TopBar() {
    const [isMainTopBarVisible, setIsMainTopBarVisible] = useState(true);

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    useEffect(() => {
        setIsMainTopBarVisible(!trigger);
    }, [trigger]);

    return (
        <div>
        <CssBaseline />
        <AppBar 
            position= 'fixed'
            sx={{ 
                top: isMainTopBarVisible ? 0 : -56,
                transition: 'top 0.3s ease-in-out',
                height: '56px',
                backgroundColor: 'secondary.contrastText'
            }}>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <img src={`${Logo}`} alt="" width="56" height="56" />
                <Typography variant="h5" component="div" sx={{color:'text.primary' }}>
                    Alexa情報統合システム
                </Typography>
            </Toolbar>
        </AppBar>
        <AppBar 
            position= 'fixed'
            sx={{ 
                top: isMainTopBarVisible ? 56 : 0,
                transition: 'top 0.3s ease-in-out',
                height: '56px',
                backgroundImage: `url(${TopBarImg})`,
                backgroundSize: '100% 100%'
            }}>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h4" component="div">
                    ホーム
                </Typography>
            </Toolbar>
        </AppBar>
        </div>
    );
}


export default TopBar;