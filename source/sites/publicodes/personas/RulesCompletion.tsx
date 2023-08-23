import { MODEL_ROOT_RULE_NAME, NGCRules } from '@/components/publicodesUtils'
import { EngineContext } from '@/components/utils/EngineContext'
import { getQuestionsInRules } from '@/sites/publicodes/pages/QuestionList'
import { Persona } from '@/sites/publicodes/personas/personasUtils'
import { useContext } from 'react'
import { Trans } from 'react-i18next'

export default ({ rules, persona }: { rules: NGCRules; persona: Persona }) => {
	const engine = useContext(EngineContext)

	const completeQuestionList = getQuestionsInRules(engine, rules).filter(
		({ type }) => !type.includes('Mosaïque')
	)

	const intersectListToInclude = completeQuestionList.filter(
		({ dottedName }) => !Object.keys(persona?.situation).includes(dottedName)
	)

	const intersectListToExclude = Object.keys(persona?.situation).filter(
		(dottedName) =>
			!completeQuestionList.find(({ dottedName: d }) => d === dottedName)
	)

	const { missingVariables } = engine.evaluate(MODEL_ROOT_RULE_NAME)
	const missingRules = Object.keys(missingVariables).filter((dottedName) =>
		completeQuestionList.find(({ dottedName: d }) => d === dottedName)
	)

	return (
		<div>
			<h2>
				<Trans>Complétude des règles du personas:</Trans>
			</h2>
			{Object.keys(persona?.situation).length === 0 ? (
				<p>
					<Trans>
						C'est le persona par défaut. Toutes les règles ont été répondues par
						défaut
					</Trans>{' '}
					({completeQuestionList.length}).
				</p>
			) : (
				<div>
					<p>
						{persona?.nom} <Trans>a répondu à </Trans>{' '}
						{Object.keys(persona?.situation).length} <Trans>questions</Trans>.
					</p>
					{missingRules.length === 0 ? (
						<p>
							<Trans>
								✅ Aucune règle nécessitant un réponse n'a été répondue par
								défaut.
							</Trans>
						</p>
					) : (
						<details>
							<summary>
								{missingRules.length}{' '}
								{missingRules.length === 1 ? (
									<Trans>
										règle nécessitant une réponse a été répondue par défaut.
									</Trans>
								) : (
									<Trans>
										règles nécessitant une réponse ont été répondues par défaut.
									</Trans>
								)}
							</summary>
							<ul>
								{missingRules.map((dottedName) => (
									<li key={dottedName}>{dottedName}</li>
								))}
							</ul>
						</details>
					)}
					{intersectListToInclude.length === 0 ? (
						<p>
							<Trans>✅ Aucune règle du modèle est absente du persona.</Trans>
						</p>
					) : (
						<details>
							<summary>
								{intersectListToInclude.length}{' '}
								{intersectListToInclude.length === 1 ? (
									<Trans>règle est absente du persona.</Trans>
								) : (
									<Trans>règles sont absentes du persona.</Trans>
								)}
							</summary>
							<ul>
								{intersectListToInclude.map(({ dottedName }) => (
									<li key={dottedName}>{dottedName}</li>
								))}
							</ul>
						</details>
					)}
					{intersectListToExclude.length === 0 ? (
						<p>
							<Trans>✅ Aucune règle du persona n'est absente du modèle.</Trans>
						</p>
					) : (
						<details>
							<summary>
								{intersectListToExclude.length}{' '}
								{intersectListToExclude.length === 1 ? (
									<Trans>
										règle a été définie dans le persona mais est absente du
										modèle.
									</Trans>
								) : (
									<Trans>
										règles ont été définies dans le persona mais sont absentes
										du modèle.
									</Trans>
								)}
							</summary>
							<ul>
								{intersectListToExclude.map((dottedName) => (
									<li key={dottedName}>{dottedName}</li>
								))}
							</ul>
						</details>
					)}
				</div>
			)}
		</div>
	)
}
