import Title from '@/components/groupe/Title'
import {
	DottedName,
	getRelatedMosaicInfosIfExists,
	NGCRule,
	NGCRules,
	NGCRulesNodes,
	parentName,
	questionCategoryName,
} from '@/components/publicodesUtils'
import AutoCanonicalTag from '@/components/utils/AutoCanonicalTag'
import { useEngine } from '@/components/utils/EngineContext'
import toCSV from '@/components/utils/toCSV'
import { AppState } from '@/reducers/rootReducer'
import { assert } from '@/utils'
import Engine from 'publicodes'
import { Trans } from 'react-i18next'
import { useSelector } from 'react-redux'
import FriendlyObjectViewer from './FriendlyObjectViewer'

export default () => {
	const rules = useSelector((state: AppState) => state.rules)
	const engine = useEngine()
	const questionRules = Object.entries(rules)
		.map(([dottedName, v]) => ({ ...v, dottedName }))
		.filter((el) => el && el.question)

	const jsonList = getQuestionsInRules(engine, rules)

	const header = [
		'dottedName',
		'question',
		'type',
		'catégorie',
		'dans mosaïque',
		'dépendances',
	]
	const csv = toCSV(header, jsonList)

	return (
		<div>
			<AutoCanonicalTag />

			<Title title={<Trans>Les questions du modèle Nos Gestes Climat</Trans>} />

			<p>
				Voici une liste des questions qui sont posées à l'utilisateur au cours
				du test, et dans une moindre mesure au cours du parcours action. Le
				format des questions est présenté, et l'intégralité des propriétés{' '}
				<a href="https://publi.codes">publicodes</a> ainsi que les extensions
				spécifiques à Nos Gestes Climat (comme la mosaïque) sont spécifiées{' '}
				<strong>au clic</strong>. L'identifiant de la quesion est la propriété
				"dottedName".
			</p>
			<p>
				Le questionnaire est dynamique : chaque question est susceptible d'être
				conditionnée à la réponse à une autre question. Les dépendances d'une
				question sont listées avec l'icône 🗜️. Dans le cas des questions
				mosaïques, l'icône liste les questions qui constituent la mosaïque. Le
				chiffre en face des dépendances est le poids de la question évalué par
				le moteur : son ordre de priorité.
			</p>
			<textarea
				value={csv}
				css={`
					width: 90%;
				`}
			/>
			<button
				className="ui__ button small"
				onClick={() => {
					navigator.clipboard.writeText(csv)
				}}
			>
				Copier le CSV
			</button>
			<ul>
				{questionRules.map((rule) => (
					<QuestionDescription
						engine={engine}
						rules={rules}
						rule={rule}
						key={rule.dottedName}
					/>
				))}
			</ul>
		</div>
	)
}

export type Question = {
	dottedName: DottedName
	question: string
	type: string
	catégorie: string
	'dans mosaïque': boolean
	dépendances: DottedName[]
}

export function getQuestionsInRules(
	engine: Engine,
	rules: NGCRules
): Question[] {
	const rulesNodes = engine.getParsedRules() as NGCRulesNodes
	const questionRules = Object.entries(rules)
		.map(([dottedName, v]) => ({ ...v, dottedName }))
		.filter((el) => el && el.question)

	const questions = questionRules.map((rule) => {
		const { type, mosaic } = getQuestionType(rulesNodes, rule)
		const dependenciesData = computeDependencies(engine, rule.dottedName)

		assert(rule.question !== undefined, 'question is defined')

		return {
			dottedName: rule.dottedName,
			question: rule.question,
			type,
			catégorie: questionCategoryName(rule.dottedName),
			'dans mosaïque': mosaic != undefined,
			dépendances: dependenciesData.map(([k, _]) => k),
		}
	})

	return questions
}

const getQuestionType = (rules: NGCRulesNodes, rule: NGCRule) => {
	const ruleMosaicInfos = getRelatedMosaicInfosIfExists(rules, rule.nom)
	const mosaicType = ruleMosaicInfos && ruleMosaicInfos[1]?.type

	const type = rule.mosaique
		? `🪟 Mosaïque de type ${rule.mosaique.type}`
		: rule.unité ||
		  typeof rule['par défaut'] === 'number' ||
		  mosaicType === 'nombre'
		? '🔢 Numérique'
		: rule.formule && rule.formule['une possibilité']
		? '🔠 plusieurs possibilités'
		: '☑️ Oui/Non'
	return { type, mosaic: ruleMosaicInfos }
}

const computeDependencies = (engine: Engine, ruleName: DottedName) => {
	const { missingVariables } = engine.evaluate(ruleName)
	const entries = Object.entries(missingVariables).filter(
		([k]) => k !== ruleName
	)
	return entries
}

const QuestionDescription = ({
	engine,
	rule,
	rules,
}: {
	engine: Engine
	rule: NGCRule
	rules: NGCRulesNodes
}) => {
	const { type, mosaic } = getQuestionType(rules, rule)
	const category = rules[parentName(rule.dottedName, undefined, 0, -1)]
	const categoryLetter = category.titre[0]

	const dependenciesData = computeDependencies(engine, rule.dottedName)
	return (
		<li
			css={`
				details > summary {
					display: flex;
				}
				margin-top: 1rem;
			`}
		>
			<details>
				<summary>
					<span
						css={`
							text-transform: uppercase;
							background: ${category.couleur};
							color: white;
							font-weight: bold;
							width: 1.4rem;
							height: 1.4rem;
						`}
						title={category.titre}
					>
						{categoryLetter}
					</span>
					<div
						css={`
							margin-left: 0.6rem;
							h2 {
								font-size: 110%;
								margin: 0;
							}
						`}
					>
						<h2>{rule.question}</h2>

						<div
							css={`
								display: flex;
								> * {
									margin: 0 0.4rem;
								}
							`}
						>
							<span title="Type de question">{type}</span>
							{!rule.mosaique && mosaic && <span>Dans mosaïque</span>}
							{rule.mosaique && (
								<details>
									<summary className="ui__ dashed-button">C'est quoi ?</summary>
									Une mosaïque ne sert qu'à regrouper plusieurs questions, soit
									toutes numériques, soit toutes à cocher. Sa valeur n'est pas
									saisie par l'utilisateur, c'est souvent une somme. Ses
									questions sont chacunes dans cette liste.
								</details>
							)}
						</div>
						<MissingVariables data={dependenciesData} />
					</div>
				</summary>
				<FriendlyObjectViewer
					data={rule}
					context={false}
					options={{ capitalise0: false }}
				/>
			</details>
		</li>
	)
}

const MissingVariables = ({ data }) => {
	if (!data.length) return null
	return (
		<div css="margin-left: .4rem">
			🗜️&nbsp;
			<details css="display: inline-block">
				<summary>{data.length} dépendances</summary>

				<ul>
					{data.map(([k, v]) => (
						<li key={k}>
							{k} : {v}
						</li>
					))}
				</ul>
			</details>
		</div>
	)
}
