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
}


export default Log;