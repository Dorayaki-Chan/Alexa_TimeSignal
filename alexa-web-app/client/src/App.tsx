import React, { useState } from 'react';
import { Routes, Route, /*Link*/} from 'react-router-dom';

import TopBar from './parts/TopBar.tsx'
import BottomBar from './parts/BottomBar.tsx';

import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Config from './pages/Config.tsx';
import Log from './pages/Log.tsx';
import NoMatch from './pages/Nomatch.tsx';

import { PageNameContext, TopBarImgContext } from './parts/contexts.ts';

import TopBarImg from './assets/img/FJ_GRAD_H3A_RGB.png';
import { Margin } from '@mui/icons-material';

function App() {
    const [pageName, setPageName] = useState('');
    const [topBarImg, setTopBarImg] = useState(TopBarImg); // 画像のURL
    return (
        <>
            <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}> {/* バックグラウンドカラーを設定 */}
                <PageNameContext.Provider value={{pageName, setPageName}}>
                    <TopBarImgContext.Provider value={{topBarImg, setTopBarImg}}>
                        <TopBar />
                        <div className="App" style={{margin:"112px 0px"}}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                    
                                <Route path="/config" element={<Config/>} />
                                <Route path="/Log" element={<Log />} />
                                <Route path="*" element={<NoMatch />} />
                            </Routes>
                        </div>
                        <BottomBar />
                    </TopBarImgContext.Provider>
                </PageNameContext.Provider>
            </div>
        </>
    );
}

export default App;