import { useContext, useEffect } from 'react';
import { PageNameContext, TopBarImgContext } from '../parts/contexts.ts';

import TopBarImg from '../assets/img/bgg-rd-or.png';

function NoMatch() {
    const { setPageName } = useContext(PageNameContext);
    const { setTopBarImg } = useContext(TopBarImgContext);

    useEffect(() => {
        setPageName('ページ無いよ'); // ページ名を設定
        setTopBarImg(TopBarImg); // トップバーの画像を設定
    }, [setPageName, setTopBarImg]);
    return <h2>このページは存在しません。</h2>;
}


export default NoMatch;