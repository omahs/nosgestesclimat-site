import { loadPreviousSimulation, resetLocalisation } from '@/actions/actions'
import CardGameIcon from '@/components/CardGameIcon'
import ProgressCircle from '@/components/ProgressCircle'
import { extractCategories, NGCRules } from '@/components/publicodesUtils'
import { usePersistingState } from '@/hooks/usePersistState'
import { AppState } from '@/reducers/rootReducer'
import {
	answeredQuestionsSelector,
	useTestCompleted,
} from '@/selectors/simulationSelectors'
import { enquêteSelector } from '@/sites/publicodes/enquête/enquêteSelector'
import { omit } from '@/utils'
import Engine from 'publicodes'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

const ActionsInteractiveIcon = () => {
	const actionChoices = useSelector((state: AppState) => state.actionChoices)
	const count = Object.values(actionChoices).filter((a) => a === true).length
	return <CardGameIcon number={count} />
}

const openmojis = {
	test: '25B6',
	action: 'E10C',
	conference: '1F3DF',
	sondage: '1F4CA',
	profile: 'silhouette',
	silhouettes: 'silhouettes',
	personas: '1F465',
	github: 'E045',
}
export const openmojiURL = (name: string) => `/images/${openmojis[name]}.svg`
export const actionImg = openmojiURL('action')
export const conferenceImg = openmojiURL('conference')

const MenuButton = styled.div`
	margin: 0 0.2rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 110% !important;
	color: var(--darkColor);
	width: auto;
	@media (min-width: 800px) {
		flex-direction: row;
		justify-content: start;
		padding: 0;
		font-size: 100%;
		width: auto;
	}
	img,
	svg {
		display: block;
		font-size: 200%;
		margin: 0.6rem !important;
		@media (max-width: 800px) {
			margin: 0 !important;
		}
		height: auto;
	}
	@media (max-height: 600px) and (max-width: 800px) {
		img,
		svg {
			display: none;
		}
	}
`

const Button = (props: React.ComponentProps<any> & { url: string }) => {
	const location = useLocation()
	const path = location.pathname
	const isCurrent = path.includes(props.url)
	const { inactive } = props

	return (
		<Link
			to={props.url}
			css={`
				display: block;
				${inactive &&
				`
				pointer-events: none;

filter: grayscale(1);
opacity: .5;
				`}
				text-decoration: none;
				${isCurrent &&
				`
				font-weight: bold;
				background: var(--lighterColor);

				@media (max-width: 800px) {
					border-radius: 0.6rem;
				}
				`}
			`}
			{...(isCurrent
				? {
						'aria-current': 'page',
				  }
				: {})}
		>
			<MenuButton {...props} />
		</Link>
	)
}

export const sessionBarMargin = `
		@media (max-width: 800px) {
		}
`

export const buildEndURL = (rules: NGCRules, engine: Engine, slide = null) => {
	const categories = extractCategories(rules, engine),
		detailsString =
			categories &&
			categories.reduce(
				(memo, next) =>
					memo +
					next.name[0] +
					// FIXME: undefined [next.nodeValue] must be handled
					(Math.round(next.nodeValue / 10) / 100).toFixed(2),
				''
			)

	if (detailsString == null) return null

	return `/fin?details=${detailsString}${slide ? `&diapo=${slide}` : ''}`
}

export const useSafePreviousSimulation = () => {
	const previousSimulation = useSelector(
		(state: AppState) => state.previousSimulation
	)

	const dispatch = useDispatch()
	const answeredQuestions = useSelector(answeredQuestionsSelector)
	const arePreviousAnswers = !!answeredQuestions.length
	useEffect(() => {
		if (!arePreviousAnswers && previousSimulation)
			dispatch(loadPreviousSimulation())
	}, [])
}

export default function SessionBar({}) {
	useSafePreviousSimulation()

	const dispatch = useDispatch()

	const location = useLocation()
	const path = location.pathname

	const persona = useSelector((state: AppState) => state.simulation?.persona)

	const enquête = useSelector(enquêteSelector)

	const [searchParams, setSearchParams] = useSearchParams()

	const pullRequestNumber = useSelector(
		(state: AppState) => state.pullRequestNumber
	)

	const [chosenIp, chooseIp] = usePersistingState('IP', undefined)

	const { t } = useTranslation()

	const testCompleted = useTestCompleted()

	const elements = [
		<Button className="simple small" url="/simulateur/bilan">
			<ProgressCircle />
			<Trans>Le test</Trans>
		</Button>,

		<Button
			className="simple small"
			url="/actions"
			inactive={enquête && !testCompleted}
		>
			<ActionsInteractiveIcon />
			<Trans>Agir</Trans>
		</Button>,
		!enquête && (
			<Button className="simple small" url="/profil">
				<div
					css={`
						position: relative;
					`}
				>
					<img
						src={openmojiURL('profile')}
						css="width: 2rem"
						aria-hidden="true"
						width="1"
						height="1"
					/>
				</div>
				{!persona ? (
					t('Profil')
				) : (
					<span
						css={`
							background: var(--color);
							color: var(--textColor);
							padding: 0 0.4rem;
							border-radius: 0.3rem;
						`}
					>
						{persona.nom}
					</span>
				)}
			</Button>
		),
		!enquête && (
			<Button className="simple small" url="/groupes">
				<img
					src={openmojiURL('silhouettes')}
					css="width: 2rem"
					aria-hidden="true"
					width="1"
					height="1"
				/>
				<Trans>Groupes</Trans>
			</Button>
		),

		pullRequestNumber && (
			<MenuButton key="pullRequest" className="simple small">
				<a
					href={
						'https://github.com/datagir/nosgestesclimat/pull/' +
						pullRequestNumber
					}
					css={`
						display: flex;
						align-items: center;
					`}
				>
					<img
						src={openmojiURL('github')}
						css="width: 2rem"
						aria-hidden="true"
						width="1"
						height="1"
					/>
					#{pullRequestNumber}
				</a>
				<button
					onClick={() => {
						setSearchParams(omit(['PR'], searchParams))
						dispatch(resetLocalisation())
						chooseIp(undefined)
						dispatch({ type: 'SET_PULL_REQUEST_NUMBER', number: null })
					}}
				>
					<img
						css="width: 1.2rem"
						src="/images/close-plain.svg"
						width="1"
						height="1"
					/>
				</button>
			</MenuButton>
		),
	].filter(Boolean)

	if (path === '/tutoriel') return null

	return (
		<div
			css={`
				margin: 0;
				margin-top: 1rem;

				@media (max-width: 800px) {
					margin: 0;
					position: fixed;
					bottom: 0;
					left: 0;
					z-index: 100;
					width: 100%;
				}
			`}
		>
			{elements.filter(Boolean).length > 0 && (
				<NavBar isUsingCustomPR={pullRequestNumber != undefined}>
					{elements.filter(Boolean).map((Comp, i) => (
						<li key={i}>{Comp}</li>
					))}
				</NavBar>
			)}
		</div>
	)
}

const NavBar = styled.ul<{ isUsingCustomPR: any }>`
	box-shadow: rgb(187 187 187) 2px 2px 10px;
	list-style-type: none;
	display: grid;
	grid-template-columns: repeat(
		${({ isUsingCustomPR }) => (isUsingCustomPR ? 5 : 4)},
		1fr
	);
	align-items: center;

	margin: 0;
	width: 100%;
	height: 4rem;
	background: white;
	justify-content: center;
	padding: 0rem 0.3rem;

	@media (min-width: 800px) {
		display: flex;
		margin-top: 1rem;
		flex-direction: column;
		height: auto;
		background: none;
		justify-content: start;
		box-shadow: none;
		padding: 0;

		li {
			width: 100%;
		}
	}
	@media (max-height: 600px) and (max-width: 800px) {
		height: 2rem;
	}
`
