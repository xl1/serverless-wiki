import { Octokit } from '@octokit/rest';
import { Context, HttpRequest } from '@azure/functions';
import { MessageResponse, msg } from './response';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
const repository = process.env.GITHUB_REPOSITORY;
const branch = process.env.GITHUB_BRANCH;

export default async function (context: Context, req: HttpRequest): Promise<MessageResponse> {
    const { name, markdown } = req.body;
    
    if (typeof(name) !== 'string') return msg(400, 'invalid name');
    if (typeof(markdown) !== 'string') return msg(400, 'invalid markdown');
    if (!repository) return msg(200, 'repository not set');

    const [owner, repo] = repository.split('/');
    const fileParams = {
        owner,
        repo,
        path: `frontend/_data/pages${name}.md`
    };
    const { data } = await octokit.repos.getContent(fileParams).catch(() => ({ data: undefined }));
    const sha = (data && 'sha' in data) ? data.sha : undefined;

    try {
        await octokit.repos.createOrUpdateFileContents({
            ...fileParams,
            message: 'update',
            content: new Buffer(markdown, 'utf8').toString('base64'),
            sha,
            branch,
            committer: {
                name: 'wiki user',
                email: 'nouser@example.com'
            },
        });
    } finally {
        // TODO catch conflict error
    }

    return msg(200, 'ok');
};
