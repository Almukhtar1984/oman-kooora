import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

export const RichTextToHTML = ({ richText }: any) => {
    const html = documentToHtmlString(richText);

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
