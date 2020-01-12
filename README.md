# Insect - Simple Issue Tracker

Bug tracker server - REST api built using Node, Express and Mongo.

## Installation

App requires .env file to run locally. Environment variables must be set while deploying it to Heroku.
Example:

```bash
MONGOLAB_URI=[CONNECTION STRING]
SERVER_PORT=3030
ACCES_TOKEN_SECRET=megasekret
GITHUB_CLIENT_ID=[clinet id]
GITHUB_CLIENT_SECRET=[secret]
GITHUB_CB_URL=[callack url]
```

Then just run:

```bash
npm install
```

## Running app

```bash
npm start # run server
npm run dev # run server with nodemon
```

## Server: API DOC

### Issues

List of available projects:

```bash
GET /issues/projects
```

Fetch all issues issues. Response is paginated.
Optional query parameters: page and limit.
Required: project name

```bash
GET /issues/:project
```

Create new Issue in project.

```bash
POST /issues/:project
```

Retrieve issue comments. Endpoint not paginated yet.

```bash
GET /issues/:issueId/comments
```

Create a comment for issue:

```bash
POST /issues/:issueId/comments
```

Delete comment for issue:

```bash
DELETE /issues/comments/:commentId
```

Receive single issue by \_id

```bash
GET /issues/details/:id
```

Update Issue

```bash
PUT /issues/details/:id
```

Delete Issue

```bash
DELETE /issues/details/:id
```

### Application settings

Receive app settings - values for priority and status. Currently can be changed only by code change.

```bash
GET /settings
```

### Oauth

Authenticate with github account - user must register in app using github account primary email.

```bash
GET /auth/github
```

```bash
GET /auth/github/callback
```

### Users

Creating new user

```bash
POST /users/register
```

Updating user (change password, displayed name etc)

```bash
PUT /users/:id
```

User details by User Id

```bash
GET /users/id
```

Login

```bash
post /users/login
```

Logout

```bash
post /users/logout
```

Refresh token

```bash
post /users/refresh_token
```

## Author

Damian Pagowski.
Email: d.pagowski@gmail.com

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
