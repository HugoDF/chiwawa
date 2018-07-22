import puppeteer from 'puppeteer';
import qs from 'query-string';

let browser;

export async function pre() {
  browser = await puppeteer.launch({
    headless: false
  });
}

export async function post() {
  await browser.close();
}

const wait = async ms => new Promise((resolve) => setTimeout(resolve, ms));

export async function carbonScreenshot(path, language = 'auto', content, opts) {
  const options = {
    bg: 'rgba(255,255,255,0)',
    t: 'monokai',             // theme,
    l: language,                // language
    ds: true,                 // drop shadow
    wc: true,                 // window controls
    wa: false,                // auto adjust width
    pv: '48px',               // padding vertical
    ph: '32px',               // padding horizontal
    ln: false,                // lines
    ...opts,
    code: content
  };
  const url = `https://carbon.now.sh/?${qs.stringify(options)}`;
  console.log(`Fetching ${JSON.stringify(url)}`);
  try {

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page Loaded');
    await wait(500);
    page.setViewport({ width: 1920, height: 720, deviceScaleFactor: 2 });

    await screenshotDOMElement(page, {
      selector: '#container-bg',
      path: `${path}.png`
    });
    console.log(`Saved to ${path}.png`);
  } catch (error) {
    console.error(error.stack);
  }
}

async function screenshotDOMElement(page, { selector, padding = 0, path }) {
  if (!selector)
    throw Error('Please provide a selector.');

  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element)
      return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return { left: x, top: y, width, height, id: element.id };
  }, selector);

  if (!rect)
    throw Error(`Could not find element that matches selector: ${selector}.`);

  return await page.screenshot({
    path,
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }
  });
}
