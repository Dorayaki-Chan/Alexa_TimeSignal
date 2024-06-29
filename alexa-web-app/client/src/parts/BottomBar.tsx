import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import SettingsIcon from '@mui/icons-material/Settings';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/Home';


const pathToIndex: Record<string, number> = {
    '/config': 0,
    '/': 1,
    '/log': 2
};

function BottomBar() {
    const [value, setValue] = React.useState(0);
    const ref = React.useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    
    React.useEffect(() => {
        // location.pathnameがpathToIndexに存在するかチェックし、存在しない場合はデフォルト値0を使用
        const newValue = pathToIndex[location.pathname] !== undefined ? pathToIndex[location.pathname] : 4;
        setValue(newValue);
    }, [location.pathname]); // location.pathnameが変更されたときのみsetValueを実行

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // ボトムバーの値に応じてページを切り替える
         // インデックスに基づいてパスを逆引きする
        const path = Object.keys(pathToIndex).find(key => pathToIndex[key] === newValue);
        if (path) {
            // ナビゲーションロジックをここに実装
            // 例: history.push(path); // react-router-domの場合
            console.log(path);
            navigate(path);
        }
    }

    return (
        <Box sx={{ pb: 7  }} ref={ref}>
        <CssBaseline />
            <Paper sx={{position: 'fixed', bottom: 0, left: 0, right: 0}} elevation={3}>
                <BottomNavigation showLabels value={value} onChange={(event, newValue) => { handleChange(event, newValue) }}>
                    <BottomNavigationAction label="設定" icon={<SettingsIcon />} />
                    <BottomNavigationAction label="ホーム" icon={<HomeIcon />} />
                    <BottomNavigationAction label="ログ" icon={<RestoreIcon />} />
                </BottomNavigation>
            </Paper>
        </Box>
    );
}



export default BottomBar;