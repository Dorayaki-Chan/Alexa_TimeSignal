import React, { useEffect, useContext } from 'react';
import { PageNameContext, TopBarImgContext } from '../parts/contexts.ts';

import TopBarImg from '../assets/img/FJ_GRAD_H3A_RGB.png';

function Log() {
    const { setPageName } = useContext(PageNameContext);
    const { setTopBarImg } = useContext(TopBarImgContext);

    useEffect(() => {
        setPageName('ログ'); // ページ名を設定
        setTopBarImg(TopBarImg); // トップバーの画像を設定
    }, [setPageName, setTopBarImg]);

    return (
        <>
            <h1>ログ画面</h1>
            <p>ログ画面です</p>
            {Array.from({ length: 100 }, (_, i) => (
                <div key={i}>
                    <h1>ログ</h1> {/* 状態を使用してメッセージを表示 */}
                    <p>2021 2020 2222</p>
                </div>
            ))}
        </>
    );
}


export default Log;