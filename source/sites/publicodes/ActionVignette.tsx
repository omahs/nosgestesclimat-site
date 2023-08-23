import { setActionChoice } from '@/actions/actions'
import {
	getMatomoEventActionAccepted,
	getMatomoEventActionRejected,
} from '@/analytics/matomo-events'
import NotificationBubble from '@/components/NotificationBubble'
import {
	correctValue,
	DottedName,
	extractCategoriesNamespaces,
	NGCRules,
	splitName,
} from '@/components/publicodesUtils'
import { useEngine } from '@/components/utils/EngineContext'
import { useMatomo } from '@/contexts/MatomoContext'
import { getNextQuestions } from '@/hooks/useNextQuestion'
import { AppState } from '@/reducers/rootReducer'
import {
	answeredQuestionsSelector,
	situationSelector,
} from '@/selectors/simulationSelectors'
import Engine, { utils } from 'publicodes'
import emoji from 'react-easy-emoji'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { humanWeight } from './HumanWeight'
import { questionConfig } from './questionConfig'

export const disabledAction = (flatRule, nodeValue) =>
	flatRule.formule == null
		? false
		: nodeValue === 0 || nodeValue === false || nodeValue === null

export const supersededAction = (
	dottedName: DottedName,
	rules: NGCRules,
	actionChoices: DottedName[] | null
) => {
	return (
		Object.entries(rules).find(([key, r]) => {
			const supersedes = r?.action?.dépasse
			return (
				supersedes &&
				supersedes.includes(dottedName) &&
				(actionChoices ? actionChoices[key] : true)
			)
		}) != null
	)
}
const disabledStyle = `
img {
filter: grayscale(1);
}
color: var(--grayColor);
h2 {
color: var(--grayColor);
}
opacity: 0.8;
`
export const ActionListCard = ({
	evaluation,
	total,
	rule,
	focusAction,
	focused,
}) => {
	const { trackEvent } = useMatomo()

	const dispatch = useDispatch()
	const rules = useSelector((state: AppState) => state.rules)
	const { nodeValue, dottedName, title } = evaluation
	const { icônes: icons } = rule
	const actionChoices = useSelector((state: AppState) => state.actionChoices)
	const situation = useSelector(situationSelector)
	const answeredQuestions = useSelector(answeredQuestionsSelector)

	const engine = useEngine()

	const flatRule = rules[dottedName],
		noFormula = flatRule.formule == null,
		disabled = disabledAction(flatRule, nodeValue)

	const remainingQuestions = getNextQuestions(
		[evaluation.missingVariables],
		questionConfig,
		answeredQuestions,
		situation,
		engine
	)
	const nbRemainingQuestions = remainingQuestions.length
	const hasRemainingQuestions = nbRemainingQuestions > 0
	const pluralSuffix = nbRemainingQuestions > 1 ? 's' : ''
	const remainingQuestionsText = (
		<Trans i18nKey={'publicodes.ActionVignette.questionsRestantesText'}>
			{{ nbRemainingQuestions }} question{{ pluralSuffix }} restante
			{{ pluralSuffix }}
		</Trans>
	)
	const categories = extractCategoriesNamespaces(rules, engine)
	const foundCategory = categories.find(
		(cat) => cat.dottedName === splitName(dottedName)[0]
	)

	const categoryColor =
		foundCategory?.color ||
		rules[splitName(dottedName)[0]]?.couleur ||
		'var(--color)'

	const { t } = useTranslation()

	return (
		<div
			css={`
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 14.5rem;
				${noFormula && 'height: 13rem;'}
				${hasRemainingQuestions && 'background: #eee !important; '}
				position: relative;
				> div {
					padding: 0.4rem !important;
				}
				color: white;
				border: 4px solid ${categoryColor};
				border-radius: 0.6rem;
				box-shadow: 2px 2px 10px #bbb;

				${disabled ? disabledStyle : ''}
				${focused && 'border: 4px solid var(--color) !important;'}
				${actionChoices[evaluation.dottedName] &&
				`
				  border: 6px solid #2da44e;
				  background: #2da44e3b;
				`}
			`}
		>
			<div
				css={`
					background: ${categoryColor} !important;
					height: 6rem;
					width: 100%;
					display: flex;
					align-items: center;
				`}
			>
				<Link
					css={`
						z-index: 1;
						h2 {
							margin-top: 0rem;
							text-align: center;
							display: inline;
							font-size: 120%;
							font-weight: 600;
							line-height: 1.3rem;
							display: inline-block;
							color: white;
							@media (min-width: 800px) {
								font-size: 110%;
							}
						}
						text-decoration: none;
					`}
					to={'/actions/' + utils.encodeRuleName(dottedName)}
				>
					<h2>{title}</h2>
				</Link>
				{icons && (
					<span
						css={`
							position: absolute;
							top: 10%;
							transform: translateX(-50%);
							left: 50%;
							font-size: 400%;
							white-space: nowrap;
							mix-blend-mode: lighten;
							filter: grayscale(1);
							opacity: 0.3;
						`}
					>
						{emoji(icons)}
					</span>
				)}
			</div>

			<div css="margin-top: auto;">
				<div
					css={`
						position: relative;
						margin-bottom: 1.4rem;
					`}
				>
					<div
						css={hasRemainingQuestions ? 'filter: blur(1px) grayscale(1)' : ''}
					>
						<ActionValue
							{...{ dottedName, total, disabled, noFormula, engine }}
						/>
					</div>
					{hasRemainingQuestions && (
						<NotificationBubble
							onClick={() => focusAction(dottedName)}
							clickable
							title={remainingQuestionsText}
							number={remainingQuestions.length}
						></NotificationBubble>
					)}
					{hasRemainingQuestions && (
						<p
							css="color: var(--color); height: 0; cursor: pointer"
							onClick={() => focusAction(dottedName)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									focusAction(dottedName)
								}
							}}
							tabIndex="0"
						>
							{remainingQuestionsText}
						</p>
					)}
				</div>
				<div
					css={`
						display: flex;
						justify-content: space-evenly;
						button img {
							font-size: 200%;
						}
						margin-bottom: 1rem;
					`}
				>
					<button
						title={t("Choisir l'action")}
						aria-pressed={actionChoices[dottedName]}
						css={`
							${hasRemainingQuestions && 'filter: grayscale(1)'}
						`}
						onClick={(e) => {
							if (hasRemainingQuestions) {
								focusAction(dottedName)
								return null
							}

							dispatch(
								setActionChoice(
									dottedName,
									actionChoices[dottedName] === true ? null : true
								)
							)
							if (!actionChoices[dottedName]) {
								trackEvent(getMatomoEventActionAccepted(dottedName, nodeValue))
							}
							e.stopPropagation()
							e.preventDefault()
						}}
					>
						<img src="/images/2714.svg" css="width: 3rem" alt="" />
					</button>
					<button
						title={t("Rejeter l'action")}
						onClick={(e) => {
							dispatch(
								setActionChoice(
									dottedName,

									actionChoices[dottedName] === false ? null : false
								)
							)
							trackEvent(getMatomoEventActionRejected(dottedName, nodeValue))
							e.stopPropagation()
							e.preventDefault()
						}}
					>
						<img src="/images/274C.svg" css="width: 1.8rem" alt="" />
					</button>
				</div>
			</div>
		</div>
	)
}

export const ActionGameCard = ({ evaluation, total, rule }) => {
	const rules = useSelector((state) => state.rules),
		{ nodeValue, dottedName, title } = evaluation,
		{ icônes: icons } = rule

	const flatRule = rules[dottedName],
		noFormula = flatRule.formule == null,
		disabled = disabledAction(flatRule, nodeValue)

	return (
		<Link
			css={`
				${disabled ? disabledStyle : ''}
				text-decoration: none;
				width: 100%;
			`}
			to={'/actions/' + utils.encodeRuleName(dottedName)}
		>
			<div css={''}>
				<h2>{title}</h2>
				<div css={''}>
					{icons && (
						<div
							css={`
								font-size: 250%;
							`}
						>
							{emoji(icons)}
						</div>
					)}
					<div css="margin-top: 1.6rem;">
						<ActionValue {...{ dottedName, total, disabled, noFormula }} />
					</div>
				</div>
			</div>
		</Link>
	)
}

export const getFormattedActionValue = (
	{ t, i18n },
	dottedName: DottedName,
	engine: Engine
) => {
	const correctedValue = correctValue(engine.evaluate(dottedName))

	if (correctedValue == undefined) {
		return {}
	}

	const [stringValue, unit] = humanWeight(
		{ t, i18n },
		correctedValue,
		false,
		true
	)

	const sign = correctedValue > 0 ? '-' : '+'

	return { correctedValue, stringValue, unit, sign }
}

export const ActionValue = ({
	total,
	disabled,
	noFormula,
	dottedName,
	engine,
}: {
	total: number
	disabled: boolean
	noFormula: string | null
	dottedName: DottedName
	engine: Engine
}) => {
	const { t, i18n } = useTranslation()

	const { correctedValue, stringValue, unit, sign } = getFormattedActionValue(
		{ t, i18n },
		dottedName,
		engine
	)

	if (correctedValue == undefined) {
		return
	}

	const relativeValue = Math.round(100 * (correctedValue / total))

	return (
		<div
			css={`
				font-size: 100%;
				text-align: center;
			`}
		>
			{noFormula ? null : disabled ? (
				t('Non applicable')
			) : (
				<div>
					{sign}&nbsp;
					<span
						css={`
							background: var(--color);
							border-radius: 0.3rem;
							color: var(--textColor);
							padding: 0rem 0.4rem;
							padding-right: 0;
							border: 2px solid var(--color);
							border-radius: 0.3rem;
							${correctedValue != undefined &&
							correctedValue < 0 &&
							'background: #e33e3e'};
						`}
					>
						<strong>{stringValue}</strong>&nbsp;
						<span>{t(unit, { ns: 'units' })}</span>
						{total && (
							<span
								css={`
									margin-left: 0.4rem;
									padding: 0 0.2rem;
									background: var(--lighterColor);
									color: var(--color);
									border-top-right-radius: 0.3rem;
									border-bottom-right-radius: 0.3rem;
								`}
							>
								{Math.abs(relativeValue)}%
							</span>
						)}
					</span>
				</div>
			)}
		</div>
	)
}
