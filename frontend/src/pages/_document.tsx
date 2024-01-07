import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang='en'>
            <Head>
                <title>Starlancer - Starknet</title>
                <meta name="title" content="Starlancer" />
                <meta name="description" content="A Freelancer Marketplace for every one on Starknet"/>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/nprogress/0.2.0/nprogress.min.css"
                />
                <meta property="og:url" content="https://starlancer.a2n.finance/"></meta>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}