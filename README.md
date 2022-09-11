# serverless-wiki

ja: https://wiki.xl1.dev/about

### Feature

- Static
- Serverless
- Simple functions


### Design

![diagram](https://user-images.githubusercontent.com/705435/187239210-cd1fc911-0558-40d7-b9d2-2f319bdc709e.svg)

- Use a git repository as a database
- Hosted on [Azure Static Web Apps (SWA)](https://docs.microsoft.com/en-us/azure/static-web-apps/overview) as a static website
- Use GitHub API to update the content
- GitHub Actions deploy the pages to SWA on every commit
- Render data cached in a service worker while deploying so that authors can see their latest data
