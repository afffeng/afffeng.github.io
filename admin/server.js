const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fm = require('front-matter');
const cors = require('cors');

const app = express();
const PORT = 3000;

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/admin', express.static(path.join(__dirname, 'public')));

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function stringifyFrontmatter(data, content) {
  let frontmatter = '---\n';
  frontmatter += `title: "${data.title || ''}"\n`;
  frontmatter += `date: ${data.date || formatDate(new Date())}\n`;
  frontmatter += `draft: ${data.draft === true}\n`;
  if (data.description) {
    frontmatter += `description: "${data.description}"\n`;
  }
  if (data.tags && data.tags.length > 0) {
    frontmatter += `tags: [${data.tags.map(t => `"${t}"`).join(', ')}]\n`;
  }
  if (data.layout) {
    frontmatter += `layout: "${data.layout}"\n`;
  }
  frontmatter += '---\n\n';
  frontmatter += content || '';
  return frontmatter;
}

app.get('/api/posts', async (req, res) => {
  try {
    const files = await fs.readdir(POSTS_DIR);
    const posts = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (filename) => {
          const filePath = path.join(POSTS_DIR, filename);
          const content = await fs.readFile(filePath, 'utf-8');
          const parsed = fm(content);
          return {
            filename,
            title: parsed.attributes.title || filename,
            date: parsed.attributes.date ? formatDate(parsed.attributes.date) : '',
            draft: parsed.attributes.draft || false,
            description: parsed.attributes.description || '',
            tags: parsed.attributes.tags || []
          };
        })
    );
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:filename', async (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = fm(content);
    const frontmatter = { ...parsed.attributes };
    if (frontmatter.date) {
      frontmatter.date = formatDate(frontmatter.date);
    }
    res.json({
      filename: req.params.filename,
      frontmatter,
      content: parsed.body
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, date, draft, description, tags, content } = req.body;
    const slug = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new-post';

    let filename = `${slug}.md`;
    let counter = 1;
    while (true) {
      const filePath = path.join(POSTS_DIR, filename);
      try {
        await fs.access(filePath);
        filename = `${slug}-${counter}.md`;
        counter++;
      } catch {
        break;
      }
    }

    const frontmatter = { title, date: date || formatDate(new Date()), draft, description, tags };
    const fileContent = stringifyFrontmatter(frontmatter, content);
    await fs.writeFile(path.join(POSTS_DIR, filename), fileContent, 'utf-8');
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/posts/:filename', async (req, res) => {
  try {
    const { title, date, draft, description, tags, content } = req.body;
    const frontmatter = { title, date, draft, description, tags };
    const fileContent = stringifyFrontmatter(frontmatter, content);
    await fs.writeFile(path.join(POSTS_DIR, req.params.filename), fileContent, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:filename', async (req, res) => {
  try {
    await fs.unlink(path.join(POSTS_DIR, req.params.filename));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/page/:type', async (req, res) => {
  try {
    const type = req.params.type;
    let filePath;
    if (type === 'about') {
      filePath = path.join(CONTENT_DIR, 'about.md');
    } else if (type === 'projects') {
      filePath = path.join(CONTENT_DIR, 'projects', '_index.md');
    } else {
      return res.status(404).json({ error: 'Invalid page type' });
    }
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = fm(content);
    const frontmatter = { ...parsed.attributes };
    if (frontmatter.date) {
      frontmatter.date = formatDate(frontmatter.date);
    }
    res.json({
      type,
      frontmatter,
      content: parsed.body
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/page/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const { frontmatter, content } = req.body;
    let filePath;
    if (type === 'about') {
      filePath = path.join(CONTENT_DIR, 'about.md');
    } else if (type === 'projects') {
      filePath = path.join(CONTENT_DIR, 'projects', '_index.md');
    } else {
      return res.status(404).json({ error: 'Invalid page type' });
    }
    const fileContent = stringifyFrontmatter({ ...frontmatter, layout: frontmatter.layout }, content);
    await fs.writeFile(filePath, fileContent, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`管理后台已启动: http://localhost:${PORT}/admin`);
});
