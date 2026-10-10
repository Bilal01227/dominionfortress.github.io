import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(path.relative(root, full).split(path.sep).join('/'));
  }
}
walk(root);

const htmlFiles = files.filter(file => file.endsWith('.html') && file !== '404.html');
const routeFor = file => file === 'index.html' ? '/' : '/' + file.slice(0, -'index.html'.length);
const expectedRoutes = new Set(htmlFiles.map(routeFor));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const normalizedSitemap = sitemapUrls.map(url => {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://dominion-fortress.com') throw new Error('Unexpected sitemap host: ' + url);
  return parsed.pathname;
});
const duplicates = normalizedSitemap.filter((route, i) => normalizedSitemap.indexOf(route) !== i);
const missing = [...expectedRoutes].filter(route => !normalizedSitemap.includes(route));
const extra = [...new Set(normalizedSitemap)].filter(route => !expectedRoutes.has(route));
if (duplicates.length || missing.length || extra.length) {
  console.error({ duplicates, missing, extra });
  throw new Error('Sitemap does not exactly match published HTML routes.');
}
if (!files.includes('privacy/index.html') || !files.includes('security-testing-policy/index.html')) {
  throw new Error('Required privacy or security-testing policy page is missing.');
}

const unsynchronizedPages = htmlFiles.filter(file => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  return !html.includes('/assets/sales-machine.js?v=20261011')
    || !html.includes('/assets/df-experience.css?v=20261011')
    || !html.includes('/assets/df-experience.js?v=20261011');
});
if (unsynchronizedPages.length) throw new Error('Pages missing current shared runtime: ' + unsynchronizedPages.join(', '));
const sourceFiles = files.filter(file => /\.(html|js|txt|xml)$/i.test(file));
const oldEmailFiles = sourceFiles.filter(file => fs.readFileSync(path.join(root, file), 'utf8').includes('contact@dominionfortress.com'));
if (oldEmailFiles.length) throw new Error('Old contact email found in: ' + oldEmailFiles.join(', '));
const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
const siteRoutes = new Set([...expectedRoutes]);
const llmsRoutes = [...llms.matchAll(/https:\/\/dominion-fortress\.com\/[^\s)]+/g)]
  .map(match => match[0].replace(/[.,]$/, '').replace('https://dominion-fortress.com', ''));
const missingLlmsRoutes = [...new Set(llmsRoutes.filter(route => !siteRoutes.has(route)))];
if (missingLlmsRoutes.length) throw new Error('Broken routes in llms.txt: ' + missingLlmsRoutes.join(', '));
if (!files.includes('.well-known/security.txt')) throw new Error('security.txt is missing.');
const securityTxt = fs.readFileSync(path.join(root, '.well-known/security.txt'), 'utf8');
if (!securityTxt.includes('mailto:contact.dominionfortress@gmail.com') || !securityTxt.includes('https://dominion-fortress.com/security-testing-policy/')) {
  throw new Error('security.txt contact or policy URL is incorrect.');
}
const sharedJs = fs.readFileSync(path.join(root, 'assets/df-experience.js'), 'utf8');
if (!sharedJs.includes('contact.dominionfortress@gmail.com')) throw new Error('Verified contact email missing from shared experience script.');

let checkedInlineScripts = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    const source = match[2].trim();
    if (!source || /\bsrc\s*=/.test(attrs) || /application\/ld\+json/i.test(attrs)) continue;
    try {
      new vm.Script(source, { filename: file + ':inline-script-' + (++checkedInlineScripts) });
    } catch (error) {
      console.error('Inline script syntax error in ' + file + ': ' + error.message);
      throw error;
    }
  }
}

const knownFiles = new Set(files);
const brokenLinks = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const value = match[1];
    if (!value.startsWith('/') || value.startsWith('//')) continue;
    let pathname;
    try { pathname = decodeURIComponent(new URL(value, 'https://dominion-fortress.com').pathname); }
    catch { continue; }
    if (pathname === '/') pathname = '/index.html';
    else if (pathname.endsWith('/')) pathname += 'index.html';
    const target = pathname.slice(1);
    if (!knownFiles.has(target)) brokenLinks.push(file + ' -> ' + value);
  }
}
if (brokenLinks.length) {
  console.error('Broken internal links (' + brokenLinks.length + '):');
  for (const link of brokenLinks.slice(0, 50)) console.error(' - ' + link);
  throw new Error('Internal-link validation failed.');
}

console.log('Site quality checks passed.');
console.log('HTML routes in sitemap: ' + sitemapUrls.length);
console.log('Inline scripts syntax-checked: ' + checkedInlineScripts);
console.log('Internal links checked: no broken root-relative links.');
