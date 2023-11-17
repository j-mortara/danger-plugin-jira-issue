/**
 * A Danger JS plugin to link pull requests to Jira issues
 */

import {resolve} from 'url'


const link = (href, text) =>
  `<a href="${href}">${text}</a>`

const ensureUrlEndsWithSlash = (url) => {
  if (!url.endsWith('/')) {
    return url.concat('/')
  }
  return url
}

/**
 * The main function
 * @param {object} options 
 */
export default function jiraIssue(options) {
  const { key = '', url = '', emoji = ':link:', location = 'title' } =
    options || {}
  if (!url) {
    throw Error(`'url' missing - must supply JIRA installation URL`)
  }
  if (!key) {
    throw Error(`'key' missing - must supply JIRA issue key`)
  }

  const repositoryType = [
    "github",
    "gitlab"
  ].find(type => Object.keys(danger).includes(type))

  if (repositoryType === undefined) {
    throw Error(
      `Could not detect the repository's type.`
    )
  }

  // Support multiple JIRA projects.
  const keys = Array.isArray(key) ? `(${key.join('|')})` : key

  const jiraKeyRegex = new RegExp(`(${keys}-[0-9]+)`, 'g')
  let match
  const jiraIssues = []
  let jiraLocation
  switch (location) {
    case 'title': {
      jiraLocation = {
        'github': danger?.github?.pr?.title,
        'gitlab': danger?.gitlab?.mr?.title
      }[repositoryType]
      break
    }
    case 'branch': {
      jiraLocation = {
        'github': danger?.github?.pr?.head?.ref,
        'gitlab': danger?.gitlab?.mr?.source_branch
      }[repositoryType]
      break
    }
    case 'description': {
      jiraLocation = {
        'github': danger?.github?.pr?.body,
        'gitlab': danger?.gitlab?.mr?.description
      }[repositoryType]
      break
    }
    default: {
      throw Error(
        `Invalid value for 'location', must be either "title" or "branch"`
      )
    }
  }
  match = jiraKeyRegex.exec(jiraLocation)
  while (match != null) {
    jiraIssues.push(match[0])
    match = jiraKeyRegex.exec(jiraLocation)
  }
  if (jiraIssues.length > 0) {
    const jiraUrls = jiraIssues.map(issue =>
      link(resolve(ensureUrlEndsWithSlash(url), issue), issue)
    )

    // use custom formatter, or default
    if (options.format) {
      message(options.format(emoji, jiraUrls))
    } else {
      message(`${emoji} ${jiraUrls.join(', ')}`)
    }
  } else {
    const firstKey = Array.isArray(key) ? key[0] : key
    warn(
      `Please add the JIRA issue key to the PR ${location} (e.g. ${firstKey}-123)`
    )
  }
}
