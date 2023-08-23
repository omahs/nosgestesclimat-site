import {
	resetActionChoices,
	resetSimulation,
	setDifferentSituation,
} from '@/actions/actions'
import AnswerList from '@/components/conversation/AnswerList'
import Title from '@/components/groupe/Title'
import { NGCRulesNodes, safeGetSituation } from '@/components/publicodesUtils'
import useBranchData, { BranchData } from '@/components/useBranchData'
import AutoCanonicalTag from '@/components/utils/AutoCanonicalTag'
import {
	setSituationForValidKeys,
	useEngine,
} from '@/components/utils/EngineContext'
import { ScrollToTop } from '@/components/utils/Scroll'
import { AppState } from '@/reducers/rootReducer'
import GridChart from '@/sites/publicodes/chart/GridChart'
import RavijenChart from '@/sites/publicodes/chart/RavijenChart'
import ActionSlide from '@/sites/publicodes/fin/ActionSlide'
import Budget from '@/sites/publicodes/fin/Budget'
import FinShareButton from '@/sites/publicodes/fin/FinShareButton'
import { CardGrid } from '@/sites/publicodes/ListeActionPlus'
import { getQuestionsInRules } from '@/sites/publicodes/pages/QuestionList'
import {
	fetchAndSetAvailablePersonas,
	Persona,
} from '@/sites/publicodes/personas/personasUtils'
import RawActionsList from '@/sites/publicodes/personas/RawActionsList'
import RulesCompletion from '@/sites/publicodes/personas/RulesCompletion'
import Summary from '@/sites/publicodes/personas/Summary'
import { Simulation } from '@/types/simulation'
import { useEffect, useState } from 'react'
import emoji from 'react-easy-emoji'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import yaml from 'yaml'
import { questionConfig } from './questionConfig'

const visualisationChoices = {
	summary: { titre: 'Description', composant: Summary },
	actionList: { titre: 'Actions associées', composant: RawActionsList },
	exhaustivite: {
		titre: 'Exhaustivité des règles',
		composant: RulesCompletion,
	},
	profil: { titre: 'Détail Réponses', composant: AnswerList },
	ravijen: { titre: 'Graphe Bilan', composant: RavijenChart },
	budget: { titre: 'Page de fin - Budget', composant: Budget },
	'sous-catégories': { titre: 'Page de fin - Grille', composant: GridChart },
	action: { titre: 'Page de fin - Top 3 actions', composant: ActionSlide },
	emojis: {
		titre: 'Partage RS',
		composant: () => <FinShareButton showResult />,
	},
}

export default () => {
	const selectedPersona = useSelector(
		(state: AppState) => state.simulation?.persona
	)

	const [searchParams, setSearchParams] = useSearchParams({
		visualisation: 'summary',
	})

	const visualisationParam = searchParams.get('visualisation')

	const VisualisationComponent =
		visualisationChoices[`${visualisationParam}`]?.composant

	const engine = useEngine()
	const rules = useSelector((state: AppState) => state.rules)
	const personasQuestions = getQuestionsInRules(engine, rules).filter(
		({ type }) => !type.includes('Mosaïque')
	)

	const visualisationComponentProps = {
		score: engine.evaluate('bilan').nodeValue,
		headlessMode: true,
		engine: engine,
		rules: rules,
		persona: selectedPersona,
	}

	return (
		<div>
			<AutoCanonicalTag />

			<ScrollToTop />

			<Title data-cypress-id="personas-title" title={<Trans>Personas</Trans>} />
			<div
				css={`
					display: flex;
					flex-direction: row;
					align-items: center;
					margin-bottom: 1rem;
					@media (max-width: 800px) {
						flex-direction: column;
					}
				`}
			>
				<div>
					<p>
						<Trans>
							Les personas nous servent à tester le simulateur sous toutes ses
							coutures, et à vérifier qu’il s’adapte bien à toutes les
							situations de vie des citoyens métropolitains. De par leur
							présence, ils nous forcent à penser à tous les cas d’usage, pour
							nous projeter dans différentes réalités, et inclure ces réalités
							dans nos refontes du parcours de test et des actions proposées à
							la fin de ce dernier.{' '}
						</Trans>
					</p>
					<p>
						<Trans>
							Cette page vous permet de naviguer dans les parcours Nos Gestes
							Climat comme si vous étiez l'un des profils types que nous avons
							listés.
						</Trans>
					</p>
					<p>
						➡️{' '}
						<em>
							<Trans>
								Sélectionnez un persona et éventuellement un graphique à
								afficher.
							</Trans>
						</em>
					</p>
				</div>
				<div
					className="ui__ card box"
					css={`
						min-width: 16rem;
						align-items: flex-start !important;
						text-align: left !important;
					`}
				>
					{Object.entries(visualisationChoices).map(([id, elt]) => (
						<label key={id}>
							<input
								onChange={() => setSearchParams({ visualisation: id })}
								type="radio"
								value={id}
								checked={searchParams.get('visualisation') === id}
							/>
							{elt.titre}
						</label>
					))}
				</div>
			</div>
			{selectedPersona && (
				<div
					css={`
						max-width: 35rem;
						margin: 0 auto;
						display: flex;
						justify-content: center;
						${visualisationParam === 'ravijen' &&
						`
						height: 45rem;
						`};
					`}
				>
					<VisualisationComponent {...visualisationComponentProps} />
				</div>
			)}
			<PersonaGrid selectedPersona={selectedPersona} />
			<PersonaExplanations personasQuestionList={personasQuestions} />
		</div>
	)
}

export const PersonaGrid = ({
	selectedPersona,
}: {
	selectedPersona: Persona | undefined
}) => {
	const { i18n } = useTranslation()
	const dispatch = useDispatch(),
		objectif = 'bilan'

	const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([])
	const engine = useEngine()

	const branchData: BranchData = useBranchData()
	const lang = i18n.language === 'en' ? 'en-us' : i18n.language

	const navigate = useNavigate()
	const [params] = useSearchParams()
	const redirect = params.get('redirect')

	useEffect(() => {
		if (branchData.loaded) {
			fetchAndSetAvailablePersonas(
				`/personas-${lang}.json`,
				branchData,
				setAvailablePersonas
			)
		}
	}, [branchData.loaded, branchData.deployURL, lang])

	if (availablePersonas.length === 0) {
		return null
	}

	const setPersona = (persona: Persona) => {
		const safeSituation = safeGetSituation(
			persona.situation,
			engine.getParsedRules() as NGCRulesNodes
		)
		setSituationForValidKeys({
			engine,
			situation: persona.situation,
		})
		const missingVariables = engine.evaluate(objectif).missingVariables
		const defaultMissingVariables = Object.keys(missingVariables)

		const newSimulation: Simulation = {
			config: { objectifs: [objectif], questions: questionConfig },
			url: '/simulateur/bilan',
			// the schema of personas is not fixed yet
			situation: persona.situation,
			persona: persona,
			// If not specified, act as if all questions were answered : all that is not in
			// the situation object is a validated default value
			foldedSteps:
				Object.entries(persona.situation)?.length === 0
					? defaultMissingVariables
					: Object.keys(safeSituation),
		}

		dispatch(setDifferentSituation(newSimulation))

		if (redirect) navigate(redirect)
	}

	return (
		<CardGrid
			css={`
				padding: 0;
				justify-content: center;
				li {
					margin: 0.4rem;
				}
			`}
		>
			{availablePersonas.map((persona) => {
				const { nom, icônes, description, résumé } = persona
				return (
					<li key={nom}>
						<button
							className={`ui__ card box interactive light-border ${
								selectedPersona?.nom === nom ? 'selected' : ''
							}`}
							css={`
								width: 11rem !important;
								height: 13rem !important;
								padding: 0.5rem 0.25rem 0.5rem 0.25rem !important;
								margin: 0 !important;
								img {
									margin-bottom: 0.5rem;
								}
							`}
							onClick={() => {
								if (selectedPersona?.nom === nom) {
									dispatch(resetSimulation())
									dispatch(resetActionChoices())
								} else {
									setPersona(persona)
								}
							}}
						>
							<div
								css={`
									text-transform: uppercase;
									color: var(--color);
									font-size: 80%;
								`}
							>
								<div>{emoji(icônes ?? '👥')}</div>
								<div>{nom}</div>
							</div>
							<p>
								<small>{résumé ?? description}</small>
							</p>
						</button>
					</li>
				)
			})}
		</CardGrid>
	)
}

export const PersonaExplanations = ({ personasQuestionList }) => {
	return (
		<div
			css={`
				h2 {
					display: inline;
				}
				details {
					padding-bottom: 1rem;
				}
			`}
		>
			<details>
				<summary>
					<h2>
						<Trans>Qui sont-ils ?</Trans>
					</h2>
				</summary>
				<div>
					<Trans i18nKey={'publicodes.Personas.description'}>
						Nous les avons définis pour qu’ils représentent la diversité des cas
						d’usage du simulateur.{' '}
						<i>
							Toute ressemblance avec une personne existant ou ayant existé
							serait purement fortuite !
						</i>{' '}
						En aucune mesure, on ne peut dire qu’ils sont représentatifs de la
						distribution de la population française : il ne s’agit pas de coller
						aux statistiques de la population, mais de retrouver parmi nos dix
						personas au moins un qui représente chaque usage majeur et
						différenciant pour le simulateur. Ainsi, nous avons fait varier pour
						chacun d’entre eux :
						<ul>
							<li>
								Leur genre : même s’il n’influe pas sur l’empreinte, il serait
								étonnant de n’avoir que des personas “femmes”
							</li>{' '}
							<li>
								Leur âge et situation personnelle / professionnelle : au moins
								un étudiant, un retraité, un adulte au foyer, un actif
							</li>{' '}
							<li>
								La taille de leur foyer : de 1 personne à famille nombreuse
							</li>{' '}
							<li>
								Leur lieu de vie : de l’urbain, du rural et du péri-urbain, dans
								le nord, dans le sud, les plaines, la montagne et sur une île
							</li>{' '}
							<li>
								Leur logement : de l’appartement à la maison, du neuf à l’ancien
							</li>
							<li>
								Leurs modes de transport : de la marche à la voiture en passant
								par le ferry et l’avion
							</li>{' '}
							<li>
								Leur régime alimentaire : au moins un végétalien, un végétarien,
								une personne ne mangeant que du poisson, et un amateur de viande
								rouge
							</li>{' '}
							<li>
								Leur tendance à l’achat : du tout occasion au tout neuf, de
								l’acheteur compulsif à celui ou celle qui n’achète presque rien
							</li>{' '}
							<li>
								Leur façon de partir en vacances : mode de transport,
								hébergement, on trouve de tout
							</li>{' '}
							<li>Leurs loisirs : de la culture, du sport, du bien-être…</li>
						</ul>
					</Trans>
				</div>
			</details>
			<details>
				<summary>
					<h2>
						<Trans>Quelle est la liste des questions du modèle ?</Trans>
					</h2>
				</summary>
				<div>
					<p>
						<Trans i18nKey={'publicodes.Personas.listeQuestions'}>
							La liste des questions du modèle est accessible sur la page{' '}
							<a href="/questions">/questions</a>. La liste exhaustive de toutes
							les règles pour définir un persona est :
						</Trans>
					</p>
					<pre
						className="ui__ code"
						css={`
							font-size: 90%;
							height: 10rem;
						`}
					>
						<code>{yaml.stringify(personasQuestionList)}</code>
					</pre>
					<button
						className="ui__ button small"
						onClick={() => {
							navigator.clipboard.writeText(
								JSON.stringify(personasQuestionList)
							)
						}}
					>
						<Trans>Copier le YAML</Trans>
					</button>
				</div>
			</details>
			<details>
				<summary>
					<h2>
						<Trans>Comment les mettons-nous à jour ?</Trans>
					</h2>
				</summary>
				<div>
					<Trans i18nKey={'publicodes.Personas.maj'}>
						Pour qu’ils ou elles continuent de représenter la diversité des cas
						d’usage du simulateur d’empreinte carbone, nous les éditons à chaque
						ajout ou modification de ce dernier, en respectant les règles
						suivantes :
						<ul>
							<li>
								Chaque réponse possible est attribuée à au moins un persona
							</li>{' '}
							<li>
								Au moins un persona ne répond rien à la question (il lui est
								donc attribué la valeur par défaut donnée dans le simulateur).
							</li>
						</ul>
					</Trans>
				</div>
			</details>
		</div>
	)
}
