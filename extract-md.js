import fs from 'fs';
import { promisify } from 'util';
import { lexer } from 'marked';

const readFileAsync = promisify(fs.readFile);

const flatten = lists => lists.reduce((acc, curr) => acc.concat(curr), []);
const extractLists = (items, lists = []) => {
  let depth = 0;
  const start = items.findIndex(item => item.type === 'list_start');
  const end = items.findIndex(item => {
    if (item.type === 'list_start') {
      depth++;
    }
    if (item.type === 'list_end') {
      depth--;
      return depth === 0;
    }
  });
  return start === -1
    ? lists
    : extractLists(
      items.slice(end + 2),
      lists.concat([items.slice(start, end + 1)])
    );
}
const extractQuotes = (items, quotes = []) => {
  const start = items.findIndex(item => item.type === 'blockquote_start');
  const end = items.findIndex(item => item.type === 'blockquote_end');
  return start === -1
    ? quotes
    : extractQuotes(
      items.slice(end + 2),
      quotes.concat([items.slice(start, end + 1)])
    );
};

function findSnippetCandidates(lexItems) {
  const nonEmptyLexItems = lexItems.filter(({ type }) => type !== 'space');
  const lists = extractLists(nonEmptyLexItems);
  const quotes = extractQuotes(nonEmptyLexItems);
  const code = nonEmptyLexItems.filter(({ type }) => type === 'code');

  const selectedContent = [...flatten(lists), ...flatten(quotes), ...code].map(el => JSON.stringify(el));
  const rest = nonEmptyLexItems.filter(
    el => !selectedContent.find(
      selectedEl => selectedEl === JSON.stringify(el)
    )
  );

  // const accentuatedText = rest.filter(({ type, text }) => type === 'paragraph' && text.includes('_'));

  return {
    candidates: [...quotes, ...lists, ...code],
    quotes,
    lists,
    code,
    rest
  };
}

export async function extractSnippets(filePath) {
  const markdown = await readFileAsync(filePath, 'utf-8');
  const syntaxTree = lexer(markdown);
  const snippetCandidates = findSnippetCandidates(syntaxTree);
  return snippetCandidates;
}
