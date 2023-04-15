import path from 'path';
import { Octokit } from '@octokit/rest';
import { Context, HttpRequest } from '@azure/functions';
import { MessageResponse, msg } from './response.js';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
const repository = process.env.GITHUB_REPOSITORY;
const branch = process.env.GITHUB_BRANCH;

function validateName(name: unknown): boolean {
    return typeof(name) === 'string'
        && !!name
        && name.startsWith('/')
        && !name.startsWith('/api/')
        && !name.startsWith('/_data/')
        && name === encodeURI(decodeURI(name));
}

export default async function (context: Context, req: HttpRequest): Promise<MessageResponse> {
    const { name, markdown } = req.body;

    if (!validateName(name)) return msg(400, 'invalid name');
    if (typeof(markdown) !== 'string') return msg(400, 'invalid markdown');
    if (!repository) return msg(200, 'repository not set');

    const [owner, repo] = repository.split('/');
    const fileParams = {
        owner,
        repo,
        path: `frontend/_data/pages${decodeURI(name)}.md`,
        ref: branch
    };
    const relativePath = path.relative('frontend/_data', fileParams.path);
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return msg(400, 'invalid path');
    }

    const { data } = await octokit.repos.getContent(fileParams).catch(() => ({ data: undefined }));
    const sha = (data && 'sha' in data) ? data.sha : undefined;

    await octokit.repos.createOrUpdateFileContents({
        ...fileParams,
        message: `update ${decodeURI(name)}`,
        content: Buffer.from(markdown, 'utf8').toString('base64'),
        sha,
        branch,
        committer: {
            name: 'wiki user',
            email: 'nouser@example.com'
        },
    });

    return msg(200, 'ok');
};
