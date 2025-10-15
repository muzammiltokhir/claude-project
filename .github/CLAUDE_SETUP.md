# Claude Code Review Setup Guide

This guide will help you configure Claude AI as an automated code reviewer for your pull requests.

## Prerequisites

- GitHub repository with Actions enabled
- Admin access to the repository (to add secrets)

## Step 1: Obtain a Claude Code OAuth Token

1. Go to [Claude Code](https://claude.ai/code) or the Claude Code OAuth provider
2. Sign up or log in to your account
3. Navigate to the OAuth or integrations section
4. Generate an OAuth token for GitHub integration
5. Copy the generated OAuth token (keep it secure!)

**Important:** Keep your OAuth token secure and never commit it to your repository.

**Note:** If you're unsure where to obtain the Claude Code OAuth token, check the [Claude Code Action documentation](https://github.com/anthropics/claude-code-action) for the latest authentication methods.

## Step 2: Add OAuth Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set the following:
   - **Name:** `CLAUDE_CODE_OAUTH_TOKEN`
   - **Secret:** Paste the OAuth token you obtained from Claude Code
5. Click **Add secret**

## Step 3: Verify the Setup

### Test the Workflow

1. Create a new branch in your repository:
   ```bash
   git checkout -b test-claude-review
   ```

2. Make a small change (e.g., add a comment to a file):
   ```bash
   echo "// Test comment" >> src/app.ts
   git add src/app.ts
   git commit -m "Test: Verify Claude code review"
   git push origin test-claude-review
   ```

3. Create a pull request on GitHub

4. Check the **Actions** tab in your repository to see the workflow running

5. Once complete, Claude's review comments should appear on your PR

### Expected Behavior

- The workflow triggers automatically when you open, update, or reopen a pull request
- Claude analyzes the code changes in the PR
- Review comments appear directly on the PR with:
  - Code quality feedback
  - TypeScript/Node.js/Firebase best practices
  - Security considerations
  - Potential bugs or improvements

## Troubleshooting

### Workflow Not Running

- **Check permissions:** Ensure GitHub Actions is enabled in your repository settings
- **Check branch protection:** If you have branch protection rules, ensure Actions can run on PRs

### Authentication Errors

- **Verify secret name:** Must be exactly `CLAUDE_CODE_OAUTH_TOKEN`
- **Check OAuth token validity:** Ensure your OAuth token is active and hasn't expired
- **Regenerate token:** If issues persist, generate a new OAuth token and update the secret

### No Review Comments

- **Check workflow logs:** Go to Actions tab → Click on the failed/completed workflow → Check logs for errors
- **API limits:** Ensure you haven't exceeded your Anthropic API usage limits
- **PR size:** Very large PRs might take longer or need special handling

## Customization

### Modify Review Focus

To customize what Claude reviews, edit `.github/workflows/claude-code-review.yml` and adjust the `prompt` section to focus on specific areas relevant to your project.

### Change Trigger Events

By default, the workflow runs on:
- `opened` - When a PR is first created
- `synchronize` - When new commits are pushed to the PR
- `reopened` - When a closed PR is reopened

You can modify the `on.pull_request.types` in the workflow file to change this behavior.

## Cost Considerations

- Claude reviews consume tokens based on the size of code changes
- Monitor your usage through your Claude Code account
- Consider setting up usage limits or alerts if available
- For high-traffic repositories, be aware of potential token consumption and review the Claude Code pricing/limits

## Additional Resources

- [Claude Code Action Documentation](https://github.com/anthropics/claude-code-action)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Anthropic API Documentation](https://docs.anthropic.com/)

## Support

If you encounter issues:
1. Check the [Claude Code Action Issues](https://github.com/anthropics/claude-code-action/issues)
2. Review GitHub Actions logs for detailed error messages
3. Verify your OAuth token and GitHub secrets configuration

