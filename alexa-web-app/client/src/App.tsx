import { Routes, Route, /*Link*/} from 'react-router-dom';

import TopBar from './parts/topNavigation.tsx'
import BottomBar from './parts/bottomNavigation.tsx';

import Home from './pages/home';
import Login from './pages/login.tsx';
import Config from './pages/config';
import Log from './pages/log';
import NoMatch from './pages/nomatch';

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