import axios from 'axios';
import { useState, useEffect, useContext} from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';

import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { PageNameContext, TopBarImgContext } from '../parts/contexts.ts';

import TopBarImg from '../assets/img/FJ_GRAD_H3A_RGB.png';
import IOSSwitch from '../parts/IosButton.tsx';
import IOSSwitchWarning from '../parts/IosButtonWarning.tsx';

function Config() {
    const [loginFlag, setloginFlag] = useState(false);
    const [name, setName] = useState('');
    const [configData, setConfigData] = useState({
        kisho: {
            flag: true,
            time: '',
        },
        shoto: {
            flag: true,
            time: '',
        },
        stop: {
            flag: true,
            startDate: '',
            endDate: '',
        }
    });

    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(true);

    const navigate = useNavigate();

    const { setPageName } = useContext(PageNameContext);
    const { setTopBarImg } = useContext(TopBarImgContext);

    useEffect(() => {
        setPageName('設定'); // ページ名を設定
        setTopBarImg(TopBarImg); // トップバーの画像を設定
    }, [setPageName, setTopBarImg]);

    useEffect(() => {
        const request = async () => {
            try {
                const response = await axios.get('http://192.168.1.10:3001/api/config', {
                    withCredentials: true
                });
                
                if (response.status != 200){
                    navigate('/login');
                }
                setName(response.data.user);
                setConfigData({
                    kisho: {
                        flag: response.data.data.kisho.flag,
                        time: response.data.data.kisho.time,
                    },
                    shoto: {
                        flag: response.data.data.shoto.flag,
                        time: response.data.data.shoto.time,
                    },
                    stop: {
                        flag: response.data.data.stop.flag,
                        startDate: response.data.data.stop.startDate,
                        endDate: response.data.data.stop.endDate,
                    }
                });
                setChecked1(response.data.data.kisho.flag);
                setChecked2(response.data.data.shoto.flag);
                setChecked3(response.data.data.stop.flag);
                setloginFlag(true);
            } catch (error) {
                console.error('API呼び出し中にエラーが発生しました:', error);
                navigate('/login');
            }
        };
        request();
    }, [navigate]);

    
    const handleChange1 = (event:React.ChangeEvent<HTMLInputElement>) => {
        alert(event.target.checked);
        setChecked1(event.target.checked);
    };
    const handleChange2 = (event:React.ChangeEvent<HTMLInputElement>) => {
        alert(event.target.checked);
        setChecked2(event.target.checked);
    };
    const handleChange3 = (event:React.ChangeEvent<HTMLInputElement>) => {
        alert(event.target.checked);
        setChecked3(event.target.checked);
    };

    return (
    <>
        {loginFlag ? (
            <>
            <Container component="main" maxWidth="xs">
                <Typography component="p" variant="subtitle1">起床</Typography>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableBody>
                            <TableRow
                                key="1"
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">総員起こしラッパ</TableCell>
                                <TableCell align="right">
                                    <IOSSwitch sx={{ m: 1 }} defaultChecked checked={checked1} onChange={(e) => handleChange1(e)} />
                                </TableCell>
                            </TableRow>
                            <TableRow
                            key="1"
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">時刻</TableCell>
                                <TableCell align="right">
                                    <TextField
                                        disabled={!checked1}
                                        id="time"
                                        type="time"
                                        defaultValue={configData.kisho.time}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                <br />
                <Typography component="p" variant="subtitle1">消灯</Typography>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableBody>
                            <TableRow
                            key="1"
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">消灯ラッパ</TableCell>
                                <TableCell align="right">
                                    <IOSSwitch sx={{ m: 1 }} defaultChecked checked={checked2} onChange={(e) => handleChange2(e)} />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                <br />
                <Typography component="p" variant="subtitle1">ラッパ演奏停止</Typography>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableBody>
                            <TableRow
                            key="1"
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">演奏停止</TableCell>
                                <TableCell align="right">
                                    <IOSSwitchWarning sx={{ m: 1 }} defaultChecked checked={checked3} onChange={(e) => handleChange3(e)} />
                                </TableCell>
                            </TableRow>
                            <TableRow
                            key="1"
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">期間</TableCell>
                                <TableCell align="right">
                                    <Box display="flex" justifyContent="flex-end" gap={2}>
                                        <TextField
                                            disabled={!checked3}
                                            label="開始日"
                                            id="start-date"
                                            type="date"
                                            defaultValue={configData.stop.startDate}
                                            InputProps={{
                                                inputProps: {
                                                    min: new Date().toISOString().split('T')[0],
                                                },
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                        <TextField
                                            disabled={!checked3}
                                            label="終了日"
                                            id="end-date"
                                            type="date"
                                            defaultValue={configData.stop.endDate}
                                            InputProps={{
                                                inputProps: {
                                                    min: configData.stop.startDate,
                                                },
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
            </>) : (
            <>
                <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                </Box>
                <Container component="main" maxWidth="xs">
                    <Stack spacing={1}>
                        {/* For other variants, adjust the size with `width` and `height` */}
                        <Skeleton variant="rectangular" height={200} />
                        <Skeleton variant="rounded" height={200} />
                    </Stack>
                </Container>
            </>
        )}    
    </>
    );
}

export default Config;