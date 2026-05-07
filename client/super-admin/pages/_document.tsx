import { createGetInitialProps } from "@mantine/next";
import Document, { Head, Html, Main, NextScript } from "next/document";
import { rtlCache } from "../lib/emotionCache";

const getInitialProps = createGetInitialProps(rtlCache);

export default class _Document extends Document {
  static getInitialProps = getInitialProps;

  render() {
    return (
      <Html>
        <Head />
        <body dir="rtl">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
