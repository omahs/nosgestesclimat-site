import { AppState } from '@/reducers/rootReducer'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export type BranchData = {
	deployURL: string
	pullRequestNumber?: string
	loaded: boolean
}

export default () => {
	const dispatch = useDispatch()
	const urlParams = new URLSearchParams(window.location.search)

	const searchPR = urlParams.get('PR')

	const pullRequestNumber = useSelector(
		(state: AppState) => state.pullRequestNumber
	)

	const setPullRequestNumber = (number) =>
		dispatch({ type: 'SET_PULL_REQUEST_NUMBER', number })

	useEffect(() => {
		if (pullRequestNumber) return
		if (searchPR) {
			setPullRequestNumber(searchPR)
			return
		}
	}, [searchPR, pullRequestNumber])

	const deployURL = pullRequestNumber
		? `https://deploy-preview-${pullRequestNumber}--ecolab-data.netlify.app`
		: process.env.NODE_ENV === 'development'
		? 'http://localhost:8081'
		: 'https://data.nosgestesclimat.fr'

	// rules are loaded from data.nosgestesclimat.fr since 26th february 2023, but PR cannot

	const loaded = pullRequestNumber !== undefined

	return {
		deployURL,
		pullRequestNumber,
		loaded,
	}
}
