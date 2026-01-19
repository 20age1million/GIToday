## Update GitHub token
1. Go to `https://github.com/settings/apps/gitoday-20age1million`
2. Go down to `Private keys` section
3. Generate and download new .pem file
4. In a terminal, in root dir, run `base64 -i ./local/<pem file> -o ./local/output;
5. Copy the resulting file `output` into env `GITHUB_APP_PRIVATE_KEY_BASE64`

## Github
@TractorBenson GitHub account installed the `GIToday - 20age1million` GitHub app
```
https://github.com/settings/apps/gitoday-20age1million
```

## Required Env
- DISCORD_TOKEN
- DISCORD_CLIENT_ID
- DISCORD_GUILD_ID
- GITHUB_APP_CLIENT_ID
- GITHUB_APP_PRIVATE_KEY_BASE64
- GITHUB_APP_INSTALLATION_ID
- ROOT=./