//import { useNavigate } from 'react-router-dom';
import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { PageNameContext, TopBarImgContext } from '../parts/contexts.ts';

import TopBarImg from '../assets/img/FJ_GRAD_H3A_RGB.png';
import Sunset from '../assets/img/sunset.svg';
import Sunrise from '../assets/img/sunrise.svg';
import LightModeIcon from '@mui/icons-material/LightMode';
import NightlightIcon from '@mui/icons-material/Nightlight';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

import axios from 'axios';
import sunCalc from 'suncalc';


function Home() {
    const { setPageName } = useContext(PageNameContext);
    const { setTopBarImg } = useContext(TopBarImgContext);
    const [currentTime, setCurrentTime] = useState(new Date());

    const options = {
        era: 'long' as const,
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
        weekday: 'long' as const,
    };

    useEffect(() => {
        setPageName('ホーム'); // ページ名を設定
        setTopBarImg(TopBarImg); // トップバーの画像を設定   
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, [setPageName, setTopBarImg]);

    const times = sunCalc.getTimes(currentTime, 35.7, 139.7);
    console.log((times.sunset.getHours() + ":" + times.sunset.getMinutes()));
    console.log((times.sunrise.getHours() + ":" + times.sunrise.getMinutes()));

    return (
        <>
            <Container component="main" maxWidth="xs">
                <Box sx={{
                    marginTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    
                    <Typography component="p" variant="h5">
                        {new Intl.DateTimeFormat('ja-JP-u-ca-japanese', options).format(currentTime)}
                    </Typography>
                    <Typography component="p" variant="h1">
                        {currentTime.toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        })}
                    </Typography>
                    
                    <table>
                        <tr>
                            <td><LightModeIcon color='error' sx={{ fontSize:35 }} /></td>
                            <td><Typography variant="h3">{(times.sunrise.getHours().toString().padStart(2, '0') + ":" + times.sunrise.getMinutes().toString().padStart(2, '0'))}</Typography></td>
                        </tr>
                        <tr>
                            {/* <td><NightlightIcon sx={{ color: 'yellow', fontSize: 35 }} /></td> */}
                            <td><NightlightIcon color='secondary' sx={{ fontSize: 35 }} /></td>
                            <td><Typography variant="h3">{(times.sunset.getHours().toString().padStart(2, '0') + ":" + times.sunset.getMinutes().toString().padStart(2, '0'))}</Typography></td>
                        </tr>
                    </table>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "center", // 水平方向の中央揃え
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin:'0 16px'}}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DeviceThermostatIcon color="success" />
                                <Typography variant="h5" component="p" display="inline">室内温度</Typography>
                            </Box>
                        <Typography variant="h1" component="p" display="inline">25<span style={{ fontSize: '0.5em' }}>℃</span></Typography>
                        </Box>
                        <Box sx={{ height: '2px', width: '100%', backgroundColor: 'black', my: 2 }}></Box> {/* 縦に線を入れるためのBox */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin:'0 16px'}}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <WaterDropIcon  color="primary"/>
                                <Typography variant="h5" component="p" display="inline">室内湿度</Typography>
                            </Box>
                            <Typography variant="h1" component="p" display="inline">60<span style={{ fontSize: '0.5em' }}>%</span></Typography>
                        </Box>
                    </Box>
                
                </Box>
            </Container>
            
        </>
    );
}


export default Home;