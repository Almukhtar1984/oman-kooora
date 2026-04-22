import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

export const RichTextToHTML = ({ richText }: any) => {
    const html = documentToHtmlString(richText);

    console.log({richText, html})

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};