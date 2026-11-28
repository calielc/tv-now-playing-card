// Semantic versioning from Conventional Commit messages.
//
//   node scripts/release-version.js --check-title "<pull request title>"
//     Exits with an error when the title is not `type: description` (with an optional scope and `!`).
//
//   node scripts/release-version.js
//     Reads the commits since the last `vX.Y.Z` tag and writes `version`, `previous` and `bump`
//     to $GITHUB_OUTPUT (or prints them). feat = minor, `!` or BREAKING CHANGE = major, anything else = patch.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert'];
const TITLE = new RegExp(`^(${TYPES.join('|')})(\\([\\w./-]+\\))?(!)?: \\S.*$`);

export function checkTitle(title) {
  if (!TITLE.test(title)) {
    throw new Error(
      `The title "${title}" must look like "type: description" or "type(scope): description". ` +
        `Types: ${TYPES.join(', ')}. Add "!" after the type for a breaking change.`,
    );
  }
}

export function bumpFor(messages) {
  let bump = 'patch';
  for (const message of messages) {
    const [subject] = message.split('\n');
    const match = subject.match(TITLE);
    if ((match && match[3]) || /^BREAKING[ -]CHANGE:/m.test(message)) return 'major';
    if (match && match[1] === 'feat') bump = 'minor';
  }
  return bump;
}

export function nextVersion(previous, bump) {
  const [major, minor, patch] = (previous ?? '0.0.0').replace(/^v/, '').split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function main(argv) {
  if (argv[0] === '--check-title') {
    checkTitle(argv[1] ?? '');
    console.log('The title is valid.');
    return;
  }

  const previous = git('tag', '--list', 'v[0-9]*.[0-9]*.[0-9]*', '--sort=-v:refname').split('\n')[0] || null;
  const range = previous ? `${previous}..HEAD` : 'HEAD';
  const messages = git('log', '--no-merges', '--format=%B%x00', range)
    .split('\0')
    .map((m) => m.trim())
    .filter(Boolean);
  const bump = bumpFor(messages);
  const version = nextVersion(previous, bump);
  const output = `version=${version}\nprevious=${previous ?? ''}\nbump=${bump}\n`;

  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  process.stdout.write(output);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
