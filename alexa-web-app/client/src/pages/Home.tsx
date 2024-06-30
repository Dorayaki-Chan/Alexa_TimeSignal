//import { useNavigate } from 'react-router-dom';
import React, { useContext, useEffect } from 'react';
import { PageNameContext, TopBarImgContext } from '../parts/contexts.ts';

import TopBarImg from '../assets/img/FJ_GRAD_H3A_RGB.png';

function Home() {
    const { setPageName } = useContext(PageNameContext);
    const { setTopBarImg } = useContext(TopBarImgContext);

    useEffect(() => {
        setPageName('ホーム'); // ページ名を設定
        setTopBarImg(TopBarImg); // トップバーの画像を設定
    }, [setPageName, setTopBarImg]);

    return (
        <>
            <div>
                <h1>ホーム画面</h1> {/* 状態を使用してメッセージを表示 */}
                <p>このページは認証されたユーザーのみがアクセスできます。</p>
            </div>
            {Array.from({ length: 100 }, (_, i) => (
                <div key={i}>
                    <h1>ホーム画面</h1> {/* 状態を使用してメッセージを表示 */}
                    <p>このページは認証されたユーザーのみがアクセスできます。</p>
                </div>
            ))}
            
        </>
    );
}


export default Home;