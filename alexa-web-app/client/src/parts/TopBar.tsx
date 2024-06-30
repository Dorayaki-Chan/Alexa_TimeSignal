import React, { useState, useEffect, useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Avatar from '@mui/material/Avatar';

import Logo from '../assets/img/my-site-logo.png';

import { PageNameContext, TopBarImgContext } from './contexts.ts';


function TopBar() {
    const [isMainTopBarVisible, setIsMainTopBarVisible] = useState(true);
    const { pageName } = useContext(PageNameContext);
    const { topBarImg } = useContext(TopBarImgContext);

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    useEffect(() => {
        setIsMainTopBarVisible(!trigger);
    }, [trigger]);

    return (
        <>
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
                <Avatar sx={{ width: 50, height: 50 }} src={Logo}/>
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
                backgroundImage: `url(${topBarImg})`,
                backgroundSize: '100% 100%'
            }}>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h4" component="div">
                    {pageName}
                </Typography>
            </Toolbar>
        </AppBar>
        </>
    );
}


export default TopBar;