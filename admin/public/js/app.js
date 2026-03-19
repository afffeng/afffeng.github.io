const API_BASE = '/api';

let currentView = 'posts';
let currentPost = null;
let isPreviewMode = false;
let confirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initButtons();
  loadPosts();
});

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });
}

function initButtons() {
  document.getElementById('new-post').addEventListener('click', () => {
    currentPost = null;
    document.getElementById('editor-title').textContent = '新建文章';
    clearEditor();
    switchView('editor');
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    switchView('posts');
  });

  document.getElementById('save-btn').addEventListener('click', savePost);
  document.getElementById('preview-toggle').addEventListener('click', togglePreview);
  document.getElementById('save-projects').addEventListener('click', saveProjects);
  document.getElementById('save-about').addEventListener('click', saveAbout);
  document.getElementById('confirm-cancel').addEventListener('click', hideConfirm);
  document.getElementById('confirm-ok').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });

  ['post-title', 'post-content', 'projects-content', 'about-content'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
  });
}

function switchView(view) {
  currentView = view;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  if (view === 'editor') {
    document.getElementById('view-editor').classList.add('active');
    updatePreview();
  } else if (view === 'projects') {
    document.getElementById('view-projects').classList.add('active');
    loadProjects();
  } else if (view === 'about') {
    document.getElementById('view-about').classList.add('active');
    loadAbout();
  } else {
    document.getElementById('view-posts').classList.add('active');
    loadPosts();
  }
}

async function loadPosts() {
  const container = document.getElementById('posts-list');
  try {
    const res = await fetch(`${API_BASE}/posts`);
    const posts = await res.json();
    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>还没有文章，点击 "新建文章" 开始创作！</p>
        </div>
      `;
      return;
    }
    container.innerHTML = posts.map(post => `
      <div class="post-card">
        <div class="post-info">
          <div class="post-title">${escapeHtml(post.title)}</div>
          <div class="post-meta">
            <span>${post.date}</span>
            ${post.draft ? '<span class="draft-badge">草稿</span>' : ''}
            ${post.tags && post.tags.length ? `
              <span class="post-tags">
                ${post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
              </span>
            ` : ''}
          </div>
        </div>
        <div class="post-actions">
          <button class="btn btn-secondary btn-sm" onclick="editPost('${post.filename}')">编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deletePost('${post.filename}', '${escapeHtml(post.title)}')">删除</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('加载文章列表失败', 'error');
  }
}

async function editPost(filename) {
  try {
    const res = await fetch(`${API_BASE}/posts/${filename}`);
    const data = await res.json();
    currentPost = data;
    document.getElementById('editor-title').textContent = '编辑文章';
    document.getElementById('post-title').value = data.frontmatter.title || '';
    document.getElementById('post-date').value = data.frontmatter.date || '';
    document.getElementById('post-draft').checked = data.frontmatter.draft;
    document.getElementById('post-description').value = data.frontmatter.description || '';
    document.getElementById('post-tags').value = (data.frontmatter.tags || []).join(', ');
    document.getElementById('post-content').value = data.content || '';
    switchView('editor');
  } catch (err) {
    showToast('加载文章失败', 'error');
  }
}

function deletePost(filename, title) {
  showConfirm(`确定要删除文章「${title}」吗？`, async () => {
    try {
      await fetch(`${API_BASE}/posts/${filename}`, { method: 'DELETE' });
      showToast('文章已删除', 'success');
      loadPosts();
    } catch (err) {
      showToast('删除失败', 'error');
    }
  });
}

function clearEditor() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('post-title').value = '';
  document.getElementById('post-date').value = today;
  document.getElementById('post-draft').checked = true;
  document.getElementById('post-description').value = '';
  document.getElementById('post-tags').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('preview-content').innerHTML = '';
}

async function savePost() {
  const title = document.getElementById('post-title').value.trim();
  if (!title) {
    showToast('请输入标题', 'error');
    return;
  }

  const data = {
    title,
    date: document.getElementById('post-date').value,
    draft: document.getElementById('post-draft').checked,
    description: document.getElementById('post-description').value.trim(),
    tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
    content: document.getElementById('post-content').value
  };

  try {
    const url = currentPost ? `${API_BASE}/posts/${currentPost.filename}` : `${API_BASE}/posts`;
    const method = currentPost ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    showToast(currentPost ? '文章已更新' : '文章已创建', 'success');
    if (!currentPost) {
      switchView('posts');
    }
  } catch (err) {
    showToast('保存失败', 'error');
  }
}

function togglePreview() {
  isPreviewMode = !isPreviewMode;
  const panel = document.getElementById('preview-panel');
  const btn = document.getElementById('preview-toggle');
  panel.style.display = isPreviewMode ? 'none' : 'block';
  btn.textContent = isPreviewMode ? '显示预览' : '预览';
}

function updatePreview() {
  const title = document.getElementById('post-title')?.value || '';
  const content = document.getElementById('post-content')?.value || '';
  const preview = document.getElementById('preview-content');
  if (preview) {
    preview.innerHTML = `<h1>${escapeHtml(title)}</h1>\n\n` + renderMarkdown(content);
  }

  const projectsContent = document.getElementById('projects-content')?.value || '';
  const projectsPreview = document.getElementById('projects-preview');
  if (projectsPreview) {
    projectsPreview.innerHTML = renderMarkdown(projectsContent);
  }

  const aboutContent = document.getElementById('about-content')?.value || '';
  const aboutPreview = document.getElementById('about-preview');
  if (aboutPreview) {
    aboutPreview.innerHTML = renderMarkdown(aboutContent);
  }
}

function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });

  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/s, match => `<ul>${match}</ul>`);

  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/^(?!<[hlu]|<p)(.*)$/gm, '<p>$1</p>');
  html = html.replace(/<p><\/p>/g, '');

  html = html.replace(/\[([^\]]*)\]\(([^\)]*)\)/g, '<a href="$2">$1</a>');

  return html;
}

async function loadProjects() {
  try {
    const res = await fetch(`${API_BASE}/page/projects`);
    const data = await res.json();
    document.getElementById('projects-title').value = data.frontmatter.title || '';
    document.getElementById('projects-content').value = data.content || '';
    updatePreview();
  } catch (err) {
    showToast('加载项目页面失败', 'error');
  }
}

async function saveProjects() {
  const title = document.getElementById('projects-title').value.trim();
  const content = document.getElementById('projects-content').value;
  try {
    await fetch(`${API_BASE}/page/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontmatter: { title, date: new Date().toISOString().split('T')[0], draft: false, layout: 'list' },
        content
      })
    });
    showToast('项目页面已保存', 'success');
  } catch (err) {
    showToast('保存失败', 'error');
  }
}

async function loadAbout() {
  try {
    const res = await fetch(`${API_BASE}/page/about`);
    const data = await res.json();
    document.getElementById('about-title').value = data.frontmatter.title || '';
    document.getElementById('about-content').value = data.content || '';
    updatePreview();
  } catch (err) {
    showToast('加载关于页面失败', 'error');
  }
}

async function saveAbout() {
  const title = document.getElementById('about-title').value.trim();
  const content = document.getElementById('about-content').value;
  try {
    await fetch(`${API_BASE}/page/about`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontmatter: { title, date: new Date().toISOString().split('T')[0], draft: false, layout: 'single' },
        content
      })
    });
    showToast('关于页面已保存', 'success');
  } catch (err) {
    showToast('保存失败', 'error');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showConfirm(message, callback) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.remove('hidden');
  confirmCallback = callback;
}

function hideConfirm() {
  document.getElementById('confirm-modal').classList.add('hidden');
  confirmCallback = null;
}
