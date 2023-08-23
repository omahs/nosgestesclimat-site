// This script uses the GitHub API which requires an access token.
// https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line
// Once you have your access token you can put it in a `.env` file at the root
// of the project to enable it during development. For instance:
//
// GITHUB_API_SECRET=f4336c82cb1e494752d06e610614eab12b65f1d1
//
// If you want to fetch unpublished "draft" release, you should check the
// "public repo" authorization when generating the access token.
require('dotenv').config()
require('isomorphic-fetch')
import { writeFileSync } from 'fs'
import { join, resolve } from 'path'

const repository = 'nosgestesclimat'
const organization = 'datagir'

async function main() {
	const dir = resolve(__dirname, '../source/locales/releases/')
	const releases = await fetchReleases()
	writeFileSync(
		join(dir, 'releases-fr.json'),
		JSON.stringify(releases, null, 2)
	)

	// The last release name is fetched on all pages (to display the banner)
	// whereas the full release data is used only in the dedicated page.
	// But since translation, releases are directly downloaded in the main bundle, making this optimization useless...
}

let { GITHUB_TOKEN } = process.env

async function fetchReleases() {
	const headers = {
		...(GITHUB_TOKEN
			? {
					Authorization: `token ${GITHUB_TOKEN}`,
			  }
			: {}),
		Accept: 'Accept: application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
	}
	const response = await fetch(
		`https://api.github.com/repos/${organization}/${repository}/releases`,
		{ headers }
	)
	const data = await response.json()
	if (!data) throw Error('fetch release failed : no releases returned')
	if (!Array.isArray(data)) {
		console.log(data)
		throw Error('fetch release failed, releases are not an array')
	}
	const filtered = data.filter(Boolean).filter((release) => !release.draft)
	console.log(`✅ Correctly downloaded ${filtered.length} releases`)
	return filtered
}

main()
