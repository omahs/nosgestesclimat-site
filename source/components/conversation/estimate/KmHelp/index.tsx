import emoji from 'Components/emoji'
import animate from 'Components/ui/animate'
import { motion } from 'framer-motion'
import {
	Dispatch,
	Fragment,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { DottedName } from 'Rules'
import styled from 'styled-components'
import { setStoredTrajets, updateSituation } from '../../../../actions/actions'
import {
	matomoEventKilometerHelpClickClose,
	matomoEventKilometerHelpClickOpen,
} from '../../../../analytics/matomo-events'
import { useMatomo } from '../../../../contexts/MatomoContext'
import {
	getLangFromAbreviation,
	getLangInfos,
} from '../../../../locales/translation'
import { freqList } from './dataHelp'
import EditableRow from './EditableRow'
import KmForm from './KmForm'
import KmHelpButton from './KmHelpButton'
import ReadOnlyRow from './ReadOnlyRow'

const openmojis = {
	calendrier: '1F4C5',
	silhouette: '1F465',
	pointer: '1F447',
	modifier: '270F',
	supprimer: 'E262',
	aide: '2699',
	sauvegarder: '1F4BE',
}
const openmojiURL = (name) => `/images/${openmojis[name]}.svg`

interface KmHelpProps {
	setFinalValue: () => {}
	dottedName: DottedName
	isFormOpen: boolean
	setIsFormOpen: Dispatch<SetStateAction<boolean>>
}

export default function KmHelp({
	setFinalValue,
	dottedName,
	isFormOpen,
	setIsFormOpen,
}: KmHelpProps) {
	const { t, i18n } = useTranslation()

	const { trackEvent } = useMatomo()

	const dispatch = useDispatch()
	const storedTrajets = useSelector((state) => state.storedTrajets)

	const [trajets, setTrajets] = useState(storedTrajets[dottedName] || [])

	const [editFormData, setEditFormData] = useState({
		motif: '',
		label: '',
		distance: 0,
		xfois: '',
		periode: '',
		personnes: 0,
	})

	const [editTrajetId, setEditTrajetId] = useState(null)

	const trajetValue = (trajet, factor) => {
		const period = freqList(t).find((f) => f.name === trajet.periode)
		const freqValue = period ? period.value * trajet.xfois : 0
		return trajet.distance * freqValue * factor(trajet)
	}
	const sum = trajets.reduce((memo, next) => {
		return memo + trajetValue(next, (trajet) => 1 / trajet.personnes)
	}, 0)

	const rawSum = trajets.reduce((memo, next) => {
		return memo + trajetValue(next, (trajet) => 1)
	}, 0)

	const covoitAvg =
		trajets.reduce((memo, next) => {
			return memo + trajetValue(next, (trajet) => trajet.personnes)
		}, 0) / rawSum

	const firstRender = useRef(true)

	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false
			return
		}
		setFinalValue(Math.round(+sum))
		dispatch(setStoredTrajets(dottedName, trajets))

		dispatch(updateSituation('transport . voiture . aide km', 'oui'))
		if (rawSum > 0 && sum > 0)
			dispatch(
				updateSituation('transport . voiture . ratio voyageurs', covoitAvg)
			)
	}, [sum])

	const formRef = useRef()
	const handleEditFormSubmit = (event) => {
		event.preventDefault()

		// can't use "useRef" here because input tag is not recognize as an <Input> and
		// native function "checkValidity" for instance doesn't work on "NumberFormat" component
		const peopleFieldToCheck = document.getElementById(
			'peopleFieldinEditableRow'
		)

		if (peopleFieldToCheck.value == 0) {
			peopleFieldToCheck.setCustomValidity(
				'Vous êtes au moins présent dans la voiture'
			)
			peopleFieldToCheck.reportValidity()
			return null
		} else {
			peopleFieldToCheck.setCustomValidity('')
		}

		if (editFormData.personnes == 0) {
			alert(t('Une personne au moins est présente dans la voiture (vous !)'))
			return null
		}

		const formToCheck = formRef.current
		const isValidForm = formToCheck.checkValidity()
		if (!isValidForm) {
			formToCheck.reportValidity()
		} else {
			const editedTrajet = { ...editFormData, id: editTrajetId }

			const newTrajets = [...trajets]

			const index = trajets.findIndex((trajet) => trajet.id === editTrajetId)

			newTrajets[index] = editedTrajet

			setTrajets(newTrajets)
			setEditTrajetId(null)
		}
	}

	const currentLangInfos = getLangInfos(getLangFromAbreviation(i18n.language))

	return (
		<>
			<div
				css={`
					text-align: right;
				`}
				key={dottedName}
			>
				<KmHelpButton
					text={
						isFormOpen ? (
							<>{t('Fermer')}</>
						) : (
							<>
								{' '}
								<span
									css={`
										margin-right: 0.25rem;
										filter: grayscale(1);
									`}
								>
									{emoji('📏')}
								</span>
								{t('Je veux être plus précis')}
							</>
						)
					}
					onHandleClick={
						isFormOpen
							? () => {
									setIsFormOpen(false)
									trackEvent(matomoEventKilometerHelpClickOpen)
							  }
							: () => {
									setIsFormOpen(true)
									setFinalValue(Math.round(+sum))
									trackEvent(matomoEventKilometerHelpClickClose)
							  }
					}
				/>
			</div>
			{isFormOpen && (
				<animate.fromTop>
					{trajets.length != 0 && (
						<div
							css={`
								display: flex;
								justify-content: flex-end;
							`}
						>
							<div
								id="explicationResultatAideKm"
								css={`
									font-size: 80%;
									font-style: italic;
									line-height: 1rem;
									margin-bottom: 0.5rem;
									text-align: right;
								`}
							>
								{t(
									'components.conversation.estimate.KmHelp.resultatKmParcouruMoyenne',
									{
										kmParcouru: rawSum.toLocaleString(
											currentLangInfos.abrvLocale
										),
										nbPersonnes: covoitAvg.toLocaleString(
											currentLangInfos.abrvLocale,
											{
												minimumFractionDigits: 1,
												maximumFractionDigits: 1,
											}
										),
									}
								)}
							</div>
						</div>
					)}
					<div
						className="ui__ card content"
						css={`
							margin-bottom: 1rem;
						`}
					>
						<h3
							css={`
								margin-bottom: 0.5rem;
							`}
						>
							{t('Détail de mes trajets')}
						</h3>

						<div
							css={`
								overflow: auto;
							`}
						>
							<form
								id="tableTrajets"
								onSubmit={handleEditFormSubmit}
								ref={formRef}
							>
								<TableTrajets>
									<thead>
										<tr>
											<th scope="col">Motif</th>
											<th scope="col" css="width: 20%">
												{t('Label')}
											</th>
											<th scope="col" css="width: 3rem">
												{t('KM', { ns: 'units' })}
											</th>
											<th scope="col" css="width: 25%">
												{t('Fréquence')}
											</th>
											<th
												scope="col"
												css="width: 10%; color: transparent; text-shadow: 0 0 0 white;"
											>
												{emoji('👥', t('Nombre de personnes'))}
											</th>
											<th scope="col" css="width: 5.5rem">
												{t('Modifier')}
											</th>
										</tr>
									</thead>
									{sum != null && (
										<tbody>
											{trajets.map((trajet) => (
												<Fragment>
													{editTrajetId === trajet.id ? (
														<EditableRow
															editFormData={editFormData}
															setEditFormData={setEditFormData}
															setEditTrajetId={setEditTrajetId}
															openmojiURL={openmojiURL}
															handleEditFormSubmit={handleEditFormSubmit}
														/>
													) : (
														<ReadOnlyRow
															trajet={trajet}
															trajets={trajets}
															setEditFormData={setEditFormData}
															setEditTrajetId={setEditTrajetId}
															setTrajets={setTrajets}
															openmojiURL={openmojiURL}
														/>
													)}
												</Fragment>
											))}
											{sum > 0 && (
												<td colSpan="6">
													<span
														css={`
															display: flex;
															justify-content: right;
														`}
													>
														<Trans>Mon total :</Trans>{' '}
														<strong>
															&nbsp;
															{sum.toLocaleString(
																currentLangInfos.abrvLocale
															)}{' '}
															km&nbsp;
														</strong>{' '}
														<Trans>(co-voiturage pris en compte)</Trans>
													</span>
												</td>
											)}
										</tbody>
									)}
								</TableTrajets>
								{!sum && (
									<small
										css={`
											text-align: center;
											font-style: italic;
											display: block;
										`}
									>
										<Trans>Vos trajets apparaîtront dans ce tableau.</Trans>{' '}
									</small>
								)}
							</form>
							<KmForm
								trajets={trajets}
								setTrajets={setTrajets}
								openmojiURL={openmojiURL}
							/>
						</div>
					</div>
				</animate.fromTop>
			)}
		</>
	)
}

const MouvingArrow = () => (
	<motion.div
		animate={{
			y: [0, 0, 0, -3, 4, 0],
		}}
		transition={{
			duration: 1.5,
			delay: 1,
			repeat: Infinity,
			repeatDelay: 0,
		}}
	>
		<img src={openmojiURL('pointer')} css="width: 1.5rem;" />
	</motion.div>
)

const TableTrajets = styled.table`
	border-spacing: 0 0.5rem;
	border-collapse: separate;
	background: white;
	font-size: 85%;
	table-layout: fixed;
	width: 100%;
	min-width: 500px;

	td,
	th {
		padding: 0.2rem;
		text-align: center;
	}

	tr {
		border-radius: 1rem;
	}

	tr:nth-child(2n) {
		background: var(--lighterColor) !important;
	}

	thead th {
		background: var(--color);
		font-weight: normal !important;
		text-transform: uppercase;
		letter-spacing: 0.03rem;
		color: #ffffff;
	}

	thead tr {
		height: 2rem;
	}

	tbody tr {
		height: 1.5rem;
	}

	th:first-child,
	td:first-child {
		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: 0.5rem;
	}
	th:last-child,
	td:last-child {
		border-bottom-right-radius: 0.5rem;
		border-top-right-radius: 0.5rem;
	}
`
