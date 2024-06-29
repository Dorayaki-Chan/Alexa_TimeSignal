import { Routes, Route, /*Link*/} from 'react-router-dom';

import TopBar from './parts/topBar.tsx';
import BottomBar from './parts/bottomBar.tsx';

import Home from './pages/home.tsx';
import Login from './pages/login.tsx';
import Config from './pages/config.tsx';
import Log from './pages/log.tsx';
import NoMatch from './pages/nomatch.tsx';

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