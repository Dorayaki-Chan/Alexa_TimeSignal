import { createContext } from "react";

const PageNameContext = createContext({
    pageName: '',
    setPageName: (name: string) => {
        console.log(name);
    },
});

const TopBarImgContext = createContext({
    topBarImg: '',
    setTopBarImg: (topBarImg: string) => {
        console.log(topBarImg);
    },
});

export { PageNameContext, TopBarImgContext };