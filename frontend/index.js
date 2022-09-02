//@ts-check
//@ts-ignore
import { marked } from 'https://unpkg.com/marked@4?module';
//@ts-ignore
import DOMPurify from 'https://unpkg.com/dompurify@2?module';
//@ts-ignore
import { html, render } from 'https://unpkg.com/lit-html@2?module';
//@ts-ignore
import { unsafeHTML } from 'https://unpkg.com/lit-html@2/directives/unsafe-html.js?module';

/**
 * @typedef {object} State
 * @prop {boolean} editing
 * @prop {boolean} sending
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
    sending: false,
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
    setState({ sending: true });
    const textArea = getTextArea();
    const response = await fetch('/api/pages', {
        method: 'POST',
        body: JSON.stringify({
            name: state.name,
            markdown: textArea.value,
        }),
        headers: {
            'content-type': 'application/json'
        }
    }).finally(() => {
        setState({ sending: false });
    });
    if (response.ok) {
        setContent(state.name, textArea.value);
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
        <button @click=${() => save(state)} .disabled=${ state.sending }>Save</button>
        <button @click=${() => setState({ editing: false })}>Cancel</button>
    </div>
    <div class="editor">
        <textarea id="markdown"
            .value=${ state.markdown }
            @keydown=${ onTextAreaInput }
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
