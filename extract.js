import fs from 'fs';
import { promisify } from 'util';
import { parse } from 'marked';
import cheerio from 'cheerio';

const readFileAsync = promisify(fs.readFile);

function findSnippetCandidates(htmlData) {
  const $ = cheerio.load(htmlData, { decodeEntities: true });
  const lists = $('ol,ul').filter(function (i, el) {
    return $(el).parentsUntil('ol,ul').length > 1;
  });
  const quotes = $('blockquote').parent();
  const codeFences = $('pre > code').parent().parent();
  // const emphasized = $('')
  // console.log(lists.length, quotes.length, codeFences.length);
  const candidates = [];
  if (lists.length > 0) {
    lists.each((_, el) => candidates.push({
      html: $(el).html(),
      content: $(el).find('ol,ul').text()
    }));
  }
  if (quotes.length > 0) {
    quotes.each((_, el) => candidates.push({
      html: $(el).html(),
      content: $(el).find('blockquote').text()
    }));
  }
  if (codeFences.length > 0) {
    codeFences.each((_, el) => candidates.push({
      html: $(el).html(),
      content: $(el).find('pre code').text()
    }));
  }
  return {
    candidates,
    quotes,
    lists,
    code: codeFences
  };
}

export async function extractSnippets(filePath) {
  const markdown = await readFileAsync(filePath, 'utf-8');
  const htmlData = parse(markdown);
  const snippetCandidates = findSnippetCandidates(htmlData);
  return snippetCandidates;
}
