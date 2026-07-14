const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const filesToConvert = [
    'project_docs/ha-tff/README.md',
    'project_docs/ha-tff/architecture.md',
    'project_docs/edp-middleware/README.md',
    'project_docs/edp-middleware/architecture.md',
    'project_docs/siliconforge/README.md',
    'project_docs/siliconforge/architecture.md',
    'blogs/01_the_mode_that_never_corrects_itself.md'
];

const template = (title, content, relativeRoot) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${relativeRoot}style.css">
    <style>
        /* Specific adjustments for markdown content */
        .md-content {
            padding: 2rem;
            background: var(--bg-secondary);
            border-radius: 6px;
            border: 1px solid var(--border-color);
            margin-top: 2rem;
        }
        .md-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 2rem auto;
            border-radius: 4px;
            border: 1px solid var(--border-color);
        }
        .md-content pre {
            background-color: #0d1117;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            border: 1px solid var(--border-color);
        }
        .md-content code {
            font-family: var(--font-mono);
        }
        .nav-back {
            margin-bottom: 2rem;
            display: inline-block;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container fade-up">
        <a href="${relativeRoot}index.html" class="nav-back">&larr; Back to Archive</a>
        <div class="md-content">
            ${content}
        </div>
    </div>
</body>
</html>`;

filesToConvert.forEach(file => {
    if (fs.existsSync(file)) {
        const md = fs.readFileSync(file, 'utf-8');
        const htmlContent = marked.parse(md);
        
        const title = path.basename(file, '.md');
        const relativeRoot = file.split('/').length > 1 ? '../'.repeat(file.split('/').length - 1) : '';
        
        const finalHtml = template(title, htmlContent, relativeRoot);
        
        const outFile = file.replace(/\.md$/, '.html');
        fs.writeFileSync(outFile, finalHtml);
        console.log(`Converted ${file} to ${outFile}`);
    } else {
        console.warn(`Warning: ${file} not found`);
    }
});

// Update index.html links
const indexFile = 'index.html';
if (fs.existsSync(indexFile)) {
    let indexHtml = fs.readFileSync(indexFile, 'utf-8');
    filesToConvert.forEach(file => {
        const outHtml = file.replace(/\.md$/, '.html');
        // Simple string replace for the exact paths
        indexHtml = indexHtml.replace(new RegExp(file, 'g'), outHtml);
    });
    fs.writeFileSync(indexFile, indexHtml);
    console.log('Updated index.html to link to .html files instead of .md');
}
