# MCP Servers for Copilot Agent Development

This document describes MCP (Model Context Protocol) servers that are useful for developing and testing Copilot agents with this repository.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol developed by Anthropic that enables AI assistants to connect with external tools and data sources. MCP servers provide standardized interfaces for AI agents to interact with various services, APIs, and tools.

## GitHub MCP Server

**Repository:** [github/github-mcp-server](https://github.com/github/github-mcp-server)  
**Status:** Official GitHub MCP server  
**Relevance:** ⭐⭐⭐⭐⭐ Essential for Copilot agent development

### Overview

The GitHub MCP Server is GitHub's official MCP implementation that connects AI tools directly to GitHub's platform. It provides comprehensive GitHub functionality through natural language interactions.

### Key Capabilities

1. **Repository Management**
   - Browse and query code
   - Search files
   - Analyze commits
   - Understand project structure

2. **Issue & PR Automation**
   - Create, update, and manage issues
   - Create and update pull requests
   - Triage bugs
   - Review code changes

3. **CI/CD & Workflow Intelligence**
   - Monitor GitHub Actions workflow runs
   - Analyze build failures
   - Manage releases
   - Get insights into development pipeline

4. **Code Analysis**
   - Examine security findings (CodeQL)
   - Review Dependabot alerts
   - Understand code patterns
   - Get comprehensive codebase insights

5. **Team Collaboration**
   - Access discussions
   - Manage notifications
   - Analyze team activity

### Usage in Copilot Sessions

When working with GitHub Copilot in VS Code or other IDEs with MCP support, the GitHub MCP server is typically available by default. Tools from this server are prefixed with `github-mcp-server-`, such as:

- `github-mcp-server-get_file_contents`
- `github-mcp-server-list_issues`
- `github-mcp-server-search_code`
- `github-mcp-server-list_pull_requests`
- `github-mcp-server-get_workflow_run`

### Installation Options

#### Remote Server (Recommended)

The easiest method is using the remote GitHub MCP Server hosted by GitHub:

**VS Code Configuration:**
```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

#### Local Server (Docker)

For more control or enterprise scenarios:

```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<your-token> \
  ghcr.io/github/github-mcp-server
```

**VS Code Configuration:**
```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "github_token",
        "description": "GitHub Personal Access Token",
        "password": true
      }
    ],
    "servers": {
      "github": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "GITHUB_PERSONAL_ACCESS_TOKEN",
          "ghcr.io/github/github-mcp-server"
        ],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
        }
      }
    }
  }
}
```

### Toolset Configuration

The GitHub MCP server supports enabling/disabling specific toolsets. Default toolsets include:
- `context` - Current user and GitHub context (strongly recommended)
- `repos` - Repository operations
- `issues` - Issue management
- `pull_requests` - PR operations
- `users` - User information

Additional toolsets available:
- `actions` - CI/CD workflows
- `code_security` - Code scanning
- `dependabot` - Dependency alerts
- `discussions` - GitHub Discussions
- `gists` - Gist management
- `labels` - Label operations
- `notifications` - Notification management
- `orgs` - Organization operations
- `projects` - GitHub Projects
- `secret_protection` - Secret scanning
- `stargazers` - Star operations

To enable specific toolsets:
```bash
GITHUB_TOOLSETS="repos,issues,pull_requests,actions,code_security" ./github-mcp-server
```

Or use `all` for all toolsets:
```bash
GITHUB_TOOLSETS="all" ./github-mcp-server
```

### Practical Use Cases for This Repository

1. **Automated Issue Management**
   - Query open issues
   - Create issues for detected problems
   - Update issue status based on code changes

2. **Pull Request Automation**
   - Create PRs with proper descriptions
   - Review PR changes
   - Check PR status and CI results

3. **Code Analysis**
   - Search for code patterns
   - Analyze commit history
   - Review security findings

4. **CI/CD Monitoring**
   - Check workflow status
   - Analyze build failures
   - Review test results

5. **Documentation Updates**
   - Find related files that need updates
   - Create PRs for documentation improvements

## Other Useful MCP Servers

While the GitHub MCP server is the most relevant for this project, here are other MCP servers that might be useful:

### Playwright MCP Server

**Repository:** [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)  
**Use Case:** Browser automation and web testing

Useful for:
- Testing web-based documentation
- Automating browser interactions
- UI testing scenarios

### Filesystem MCP Servers

Various filesystem MCP servers enable:
- File operations
- Directory traversal
- Content search

These can complement the GitHub server for local development workflows.

## Best Practices

1. **Use the Default Toolsets**: Unless you need specific functionality, stick with default toolsets to keep context focused
2. **Read-Only Mode**: For exploratory work, consider using read-only mode to prevent accidental modifications
3. **Toolset Selection**: Enable only the toolsets you need for your current task to reduce complexity
4. **Token Security**: Use environment variables or secure storage for GitHub Personal Access Tokens

## References

- [GitHub MCP Server Documentation](https://github.com/github/github-mcp-server)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [VS Code MCP Integration](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
