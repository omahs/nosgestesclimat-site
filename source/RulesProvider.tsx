import LocalisationProvider from '@/components/localisation/LocalisationProvider'
import useLocalisation from '@/components/localisation/useLocalisation'
import { useCurrentRegionCode } from '@/components/localisation/utils'
import useBranchData from '@/components/useBranchData'
import {
	EngineProvider,
	SituationProvider,
} from '@/components/utils/EngineContext'
import { getCurrentLangAbrv } from '@/locales/translation'
import {
	AppState,
	defaultRulesOptions,
	RulesOptions,
} from '@/reducers/rootReducer'
import {
	configSituationSelector,
	situationSelector,
} from '@/selectors/simulationSelectors'
import Engine from 'publicodes'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import AnimatedLoader from './AnimatedLoader'

export default ({ children }) => {
	return <EngineWrapper>{children}</EngineWrapper>
}

const EngineWrapper = ({ children }) => {
	const engineState = useSelector((state: AppState) => state.engineState)
	const engineRequestedOnce = engineState.state !== null
	const rules = useSelector((state: AppState) => state.rules)
	const dispatch = useDispatch()

	const branchData = useBranchData()
	const localisation = useLocalisation()

	const currentRegionCode = useCurrentRegionCode(localisation)
	const optimizedOption = engineState?.options?.optimized
	const parsedOption = engineState?.options?.parsed

	const { i18n } = useTranslation()
	const currLangAbrv = getCurrentLangAbrv(i18n)

	useEffect(() => {
		let active = true

		const fetchAndSetRules = () => {
			if (!branchData.loaded) return
			if (!engineRequestedOnce) return

			const fileName =
				// TODO: find a better way to manage 'en'
				`/co2-model.${currentRegionCode}-lang.${
					i18n.language === 'en' ? 'en-us' : currLangAbrv
				}${optimizedOption ? '-opti' : ''}.json`

			if (process.env.NODE_ENV === 'development') {
				const rules = require('../nosgestesclimat/public' + fileName)
				if (active) {
					dispatch({ type: 'SET_RULES', rules })
				}
			} else {
				const url =
					currLangAbrv && currentRegionCode && branchData.deployURL + fileName
				console.log('fetching:', url)
				fetch(url, { mode: 'cors' })
					.then((response) => response.json())
					.then((json) => {
						if (active) {
							dispatch({ type: 'SET_RULES', rules: json })
						}
					})
					.catch((err) => {
						console.log('url:', url)
						console.log('err:', err)
					})
			}
		}
		fetchAndSetRules()
		return () => {
			active = false
		}
	}, [
		dispatch,
		branchData.deployURL,
		branchData.loaded,
		i18n.language,
		currentRegionCode,
		optimizedOption,
		engineRequestedOnce,
	])

	const engine = useMemo(() => {
		const shouldParse = engineRequestedOnce && rules && parsedOption
		if (shouldParse) {
			console.log(
				`⚙️ will parse ${Object.keys(rules).length} rules,  expensive operation`
			)
			console.time('⚙️ parsing rules')
			const engine = new Engine(rules)
			console.timeEnd('⚙️ parsing rules')

			return engine
		}
		return undefined
		// We rely on this useMemo hook to store multiple Engines.
		// Say the test component requests the optimized parsed rules,
		// then the documentation loads the complete rules, then the user
		// goes back to the test component : the Engine shouldn't be parsed again
		// but picked from the hook'e memo.
		// TODO : test this : React says we shouldn't rely on this feature
	}, [engineRequestedOnce, branchData.deployURL, rules, parsedOption])

	useEffect(() => {
		if (engine !== undefined || (parsedOption === false && rules)) {
			dispatch({ type: 'SET_ENGINE', to: { ...engineState, state: 'ready' } })
		}
		return
	}, [engine, parsedOption, rules])

	const userSituation = useSelector(situationSelector)
	const configSituation = useSelector(configSituationSelector)
	const situation = useMemo(
		() => ({
			...configSituation,
			...userSituation,
		}),
		[configSituation, userSituation]
	)

	return (
		<LocalisationProvider>
			<EngineProvider value={engine}>
				<SituationProvider situation={situation}>{children}</SituationProvider>
			</EngineProvider>
		</LocalisationProvider>
	)
}

type AnyObjectType = {
	[key: string]: any
}

export const WithEngine = ({
	options = defaultRulesOptions,
	children,
	fallback = <AnimatedLoader />,
}: React.PropsWithChildren & {
	options?: RulesOptions
	children: JSX.Element
	fallback?: JSX.Element
}): JSX.Element => {
	console.log('calling WithEngine with options', options)
	const dispatch = useDispatch()
	const engineState = useSelector((state: AppState) => state.engineState)
	const currentRulesOptions = engineState?.options

	useEffect(() => {
		options?.optimized
			? console.log('🗜️  Optimized rules requested')
			: console.log('💯 Complete rules requested')
		if (
			// This is a fixed point, no interest to go back to optimized at this point
			engineState.state === 'ready' &&
			sameOptions(currentRulesOptions, { optimized: false, parsed: true })
		)
			return
		if (
			engineState.state !== 'ready' ||
			!sameOptions(options, currentRulesOptions)
		)
			dispatch({ type: 'SET_ENGINE', to: { state: 'requested', options } })
		return
	}, [])

	if (
		engineState.state !== 'ready' ||
		(!sameOptions(options, currentRulesOptions) &&
			!sameOptions({ parsed: true, optimized: false }, currentRulesOptions))
	) {
		return fallback
	}

	return children
}

const sameOptions = (a: AnyObjectType, b: AnyObjectType) =>
	Object.keys(a).every((k) => a[k] === b[k])
