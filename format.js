import { carbonScreenshot, pre, post } from './carbon-screenshot';


export async function format(data, pathBase = './') {
  const date = Date.now();
  await pre();
  await traverse(data.map((el, i) => {
    const { /* type, */ lang, text } = el;
    const languageMap = {
      js: 'javascript',
      html: 'htmlmixed',
      css: 'css'
    };
    return () => carbonScreenshot(
      `${pathBase}${date}-${i}`,
      languageMap[lang],
      text
    );
  }));
  await post();
}

function traverse([promiseFn, ...promiseFns]) {
  return promiseFns.length > 0
    ? promiseFn().then(() => traverse(promiseFns))
    : promiseFn();
}
