import animate from 'Components/ui/animate'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AnyAction } from 'redux'
import {
	updateAmortissementAvion,
	updateSituation,
} from '../../../actions/actions'
import emoji from '../../emoji'
import { formatFloat } from '../../utils/formatFloat'
import { TrackerContext } from '../../utils/withTracker'
import KmHelpButton from '../estimate/KmHelp/KmHelpButton'
import { AmortissementObject } from './FieldTravelDuration'
import Form from './Form'

interface Props {
	amortissementAvion: AmortissementObject
	setFinalValue: (value: string) => AnyAction
	dottedName: string
	isFormOpen: boolean
	setIsFormOpen: (value: boolean) => void
}

const formatAmortissementValue = (amortissementAvion: AmortissementObject) => {
	if (!amortissementAvion) return ''
	const valueSummed =
		Object.entries(amortissementAvion).reduce(
			(sum, [key, value]) =>
				sum + (parseFloat(value.replace(',', '.') || '0') || 0),
			0
		) / 3
	if (valueSummed) {
		return formatFloat({ number: valueSummed }).replace(',', '.') || ''
	}
	return ''
}

export default function Amortissement({
	amortissementAvion: amortissementCurrent,
	setFinalValue,
	isFormOpen,
	dottedName,
	setIsFormOpen,
}: Props) {
	const { t } = useTranslation()

	const tracker = useContext(TrackerContext)

	const dispatch = useDispatch()

	const [amortissementAvion, setAmortissementAvion] = useState(
		amortissementCurrent || {}
	)

	const firstRender = useRef(true)

	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false
			return
		}

		// Set default value
		dispatch(
			setFinalValue(
				formatAmortissementValue(amortissementCurrent)
			) as unknown as AnyAction
		)

		dispatch(updateSituation('transport . avion . aide km', 'oui'))
	}, [])

	const handleUpdateAmortissementAvion = (amortissementObject) => {
		setAmortissementAvion(amortissementObject)
		setFinalValue(formatAmortissementValue(amortissementObject))
		dispatch(updateAmortissementAvion({ dottedName, amortissementObject }))
	}

	return (
		<div
			css={`
				text-align: right;
			`}
		>
			<KmHelpButton
				text={
					isFormOpen ? (
						t('Fermer')
					) : (
						<>
							<span
								css={`
									margin-right: 0.25rem;
								`}
							>
								{emoji('📅', 'Calendar')}
							</span>
							{t('Je souhaite répondre sur les 3 dernières années')}
						</>
					)
				}
				onHandleClick={() => {
					setIsFormOpen(isFormOpen ? false : true)
					tracker.push([
						'trackEvent',
						'Aide saisie km',
						'Ferme aide à la saisie km voiture',
					])
				}}
			/>
			{isFormOpen && (
				<animate.fromTop>
					<div
						className="ui__ card content"
						css={`
							margin-bottom: 1rem;
						`}
					>
						<Form
							dottedName={dottedName}
							amortissementAvion={amortissementAvion}
							setAmortissementAvion={handleUpdateAmortissementAvion}
						/>
					</div>
				</animate.fromTop>
			)}
		</div>
	)
}
