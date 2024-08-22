import { unified } from "unified";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

export const md2html = async (markdown, remove_outer_tag = false) => {
  let processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  if (remove_outer_tag) {
    // HACK!!
    return String(await processor.process(markdown)).slice(3, -4);
  }
  return String(await processor.process(markdown));
};
