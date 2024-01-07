import 'antd/dist/reset.css';
import type { AppProps } from 'next/app';
import { Provider } from "react-redux";
import { LayoutProvider } from 'src/components/LayoutProvider';
import { store } from 'src/controller/store';
import "../styles/app.css";
import Router from "next/router";
import NProgress from "nprogress";
import withTheme from 'src/theme';
import { useEffect, useState } from 'react';

Router.events.on("routeChangeStart", (url) => {
  NProgress.start()
})

Router.events.on("routeChangeComplete", (url) => {
  NProgress.done()
})

Router.events.on("routeChangeError", (url) => {
  NProgress.done()
})
export default function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (typeof window !== 'undefined') {
    window.onload = () => {
      document.getElementById('holderStyle')!.remove();
    };
  }

  return (

    <Provider store={store}>
      <style
        id="holderStyle"
        dangerouslySetInnerHTML={{
          __html: `
                    *, *::before, *::after {
                        transition: none!important;
                    }
                    `,
        }}
      />
     
        <div style={{ visibility: !mounted ? 'hidden' : 'visible' }}>
          {

            withTheme(<LayoutProvider>
              <Component {...pageProps} />
            </LayoutProvider>)
          }

        </div>
 
    </Provider >

  )
}
