//@ts-check
//@ts-ignore
import { marked } from 'https://esm.sh/marked@4';
//@ts-ignore
import DOMPurify from 'https://esm.sh/dompurify@2';
//@ts-ignore
import { html, render } from 'https://esm.sh/lit-html@2';
//@ts-ignore
import { unsafeHTML } from 'https://esm.sh/lit-html@2/directives/unsafe-html.js';

/**
 * @typedef {object} State
 * @prop {boolean} editing
 * @prop {string} content
 * @prop {string} markdown
 * @prop {string} name
 */

/**
 * @param {State} initial
 * @returns {(newValues: Partial<State>) => void}
 */
function createStore(initial) {
    let data = initial;
    return newValues => {
        data = { ...data, ...newValues };
        render(App(data), document.body);
    };
}

const setState = createStore({
    editing: false,
    content: '',
    markdown: '',
    name: '',
});

const getTextArea = () => /** @type {HTMLTextAreaElement} */(document.getElementById('markdown'));

/** @param {MouseEvent} ev */
async function onPageClick(ev) {
    if (ev.target instanceof HTMLAnchorElement && ev.target.origin === location.origin) {
        ev.preventDefault();
        history.pushState({}, '', ev.target.href);
        await navigate();
    }
}

/** @param {KeyboardEvent} ev */
function onTextAreaInput(ev) {
    if (ev.key === 'Tab') {
        ev.preventDefault();
        const textArea = getTextArea();
        textArea.setRangeText('    ', textArea.selectionStart, textArea.selectionEnd, 'end');
    }
}

/** @param {DragEvent} ev */
function onTextAreaDrop(ev) {
    ev.preventDefault();
    const file = ev.dataTransfer && ev.dataTransfer.files[0];
    upload(file).catch(console.error);
}

/** @param {ClipboardEvent} ev */
function onTextAreaPaste(ev) {
    const file = ev.clipboardData && ev.clipboardData.files[0];
    upload(file).catch(console.error);
}

/** @param {File|null} file */
async function upload(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) {
        alert('unsupported file');
        return;
    }

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: file,
        headers: {
            'content-type': 'application/octet-stream',
            'x-file-type': file.type,
        }
    });
    const { message } = await response.json();
    if (response.ok) {
        const textArea = getTextArea();
        textArea.setRangeText(`![${file.name}](${message})`, textArea.selectionStart, textArea.selectionEnd, 'select');
    } else {
        alert(message);
    }
}

/**
 * @param {string} name
 * @param {string} markdown
 */
function setContent(name, markdown) {
    const parsed = marked.parse(markdown, { gfm: true });
    const content = DOMPurify.sanitize(parsed);
    setState({ name, markdown, content, editing: false });
}

async function navigate() {
    let name = location.pathname;
    if (name === '/') name = '/index';
    const response = await fetch(`/_data/pages${name}.md`);
    if (response.ok) {
        const markdown = await response.text();
        if (markdown) {
            setContent(name, markdown);
            return;
        }
    }
    setState({ name, markdown: '', content: '', editing: true });
}

/** @param {State} state */
async function save(state) {
    const name = state.name;
    const markdown = getTextArea().value;

    const button = /** @type {HTMLButtonElement} */(document.getElementById('save'));
    button.disabled = true;
    const response = await fetch('/api/pages', {
        method: 'POST',
        body: JSON.stringify({ name, markdown }),
        headers: { 'content-type': 'application/json' }
    }).finally(() => {
        button.disabled = false;
    });

    if (response.ok) {
        setContent(name, markdown);
    } else {
        const { message } = await response.json();
        alert(message);
    }
}

/** @param {State} state */
const Page = state => html`
    <div class="menu">
        <a href="/" @click=${ onPageClick }>🔼</a>
        <button @click=${() => setState({ editing: true })}>Edit</button>
    </div>
    <div class="main" @click=${ onPageClick }>${ unsafeHTML(state.content) }</div>
`;

/** @param {State} state */
const Editor = state => html`
    <div class="menu">
        <a href="/" @click=${ onPageClick }>🔼</a>
        <button @click=${() => save(state)} id="save">Save</button>
        <button @click=${() => setState({ editing: false })}>Cancel</button>
    </div>
    <div class="editor">
        <textarea id="markdown"
            .value=${ state.markdown }
            @keydown=${ onTextAreaInput }
            @dragover=${ e => e.preventDefault() }}
            @drop=${ onTextAreaDrop }
            @paste=${ onTextAreaPaste }
        ></textarea>
    </div>
`;

/** @param {State} state */
const Index = state => html`
    <div id="index"></div>
`;

/** @param {State} state */
const App = state => html`
    ${ state.editing ? Editor(state) : Page(state) }
    ${ Index(state) }
`;

navigate().catch(console.error);
self.addEventListener('popstate', navigate);
navigator.serviceWorker.register('/serviceworker.js').catch(console.error);
