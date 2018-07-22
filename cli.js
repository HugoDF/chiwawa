import { promisify } from 'util';
import inquirer from 'inquirer';
import hermit from 'hermit';
import Turndown from 'turndown';
import globby from 'globby';
import { extractSnippets } from './extract';
import { format } from './format';

// import { parser } from 'marked';
// import { extractSnippets } from './extract-md';

const hermitAsync = promisify(hermit);

const flatten = arr => arr.reduce((prev, curr) => prev.concat(curr), []);

async function run() {
  const args = process.argv.slice(2);
  const inputPaths = flatten(await Promise.all(args.map(globby)));
  const snippetCandidates = flatten(
    await Promise.all(inputPaths.map(path => extractSnippets(path)))
  ).reduce(
    (prev, curr) => {
      Object.entries(curr).forEach(([k, v]) => {
        prev[k] = (prev[k] || []).concat(v);
      });
      return prev;
    }, {}
  );
  const turndown = Turndown({ codeBlockStyle: 'fenced' });
  const { candidates } = snippetCandidates;
  const formattedTasks = await Promise.all(Object.values(candidates).map(async candidate => {
    const { html, content } = candidate;
    const markdown = turndown.turndown(html);
    return {
      raw: content,
      markdown,
      message: await hermitAsync(html),
    };
  }));
  const snippets = [];
  for (const task of formattedTasks) {
    console.log(task.message);

    const { confirm: isSnippet } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Is it a snippet?',
      default: false
    }]);
    if (isSnippet) {
      snippets.push({
        text: task.raw
      });
    }
  }

  // TODO put into editable state
  // const { confirm: shouldWriteToFile } = await inquirer.prompt([{
  //   type: 'confirm',
  //   name: 'confirm',
  //   message: 'Do you want to edit any of the snippets?',
  //   default: false
  // }]);

  // if (shouldWriteToFile) {
  //   snippets.map(snippet => {
  //     return snippet.markdown;
  //   });
  //   return
  // }
  await format(snippets);
};

run()
  .then(
    () => process.exit(0),
    error => {
      console.error(error);
      process.exit(1);
    }
  )
