import { createContext } from "react";

const PageNameContext = createContext({
    pageName: '',
    setPageName: (name: string) => {},
});

const TopBarImgContext = createContext({
    topBarImg: '',
    setTopBarImg: (topBarImg: string) => {},
});

export { PageNameContext, TopBarImgContext };