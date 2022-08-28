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
 * @prop {string} content
 * @prop {string} markdown
 * @prop {string} path
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
    path: '',
});

/** @param {MouseEvent} ev */
async function onPageClick(ev) {
    if (ev.target instanceof HTMLAnchorElement && ev.target.origin === location.origin) {
        ev.preventDefault();
        history.pushState({}, '', ev.target.href);
        await navigate();
    }
}

async function navigate() {
    let path = location.pathname;
    if (path === '/') path = '/index';
    const response = await fetch(`/_data/pages${path}.md`);
    if (response.ok) {
        const markdown = await response.text();
        const parsed = marked.parse(markdown, { gfm: true });
        const content = DOMPurify.sanitize(parsed);
        setState({ path, markdown, content });
    } else {
        setState({ path, editing: true });
    }
}

async function save() {
    setState({ editing: false });
}

/** @param {State} state */
const Menu = state => state.editing
    ? html`<div id="menu">
        <button @click=${ save }>Save</button>
        <button @click=${() => setState({ editing: false })}>Cancel</button>
    </div>`
    : html`<div id="menu">
        <button @click=${() => setState({ editing: true })}>Edit</button>
    </div>`;

/** @param {State} state */
const Page = state => html`
    <div class="main" @click=${ onPageClick }>${ unsafeHTML(state.content) }</div>
`;

/** @param {State} state */
const Editor = state => html`
    <div class="editor"><textarea .value=${ state.markdown }></textarea></div>
`;

/** @param {State} state */
const Index = state => html`
    <div id="index"></div>
`;

/** @param {State} state */
const App = state => html`
    ${ Menu(state) }
    ${ state.editing ? Editor(state) : Page(state) }
    ${ Index(state) }
`;

navigate().catch(console.error);
