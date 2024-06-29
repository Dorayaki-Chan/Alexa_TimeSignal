import { Routes, Route, /*Link*/} from 'react-router-dom';

import TopBar from './parts/TopBar.tsx'
import BottomBar from './parts/BottomBar.tsx';

import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Config from './pages/Config.tsx';
import Log from './pages/Log.tsx';
import NoMatch from './pages/Nomatch.tsx';

function App() {
    return (
        <>
            <TopBar />
            <div className="App">
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
    
                  <Route path="/config" element={<Config/>} />
                  <Route path="/Log" element={<Log />} />
                  <Route path="*" element={<NoMatch />} />
              </Routes>
            </div>
            <BottomBar />
        </>
    );
}

export default App;