import { matomoEventKilometerHelp } from '@/analytics/matomo-events'
import { useMatomo } from '@/contexts/MatomoContext'
import { nanoid } from 'nanoid'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import NumberFormat from 'react-number-format'
import styled from 'styled-components'
import { freqList, motifList } from './dataHelp'

export default function KmForm({ trajets, setTrajets, openmojiURL }) {
	const { t } = useTranslation()
	const { trackEvent } = useMatomo()

	const [addFormData, setAddFormData] = useState({
		motif: '',
		label: '',
		distance: 0,
		xfois: '',
		periode: '',
		personnes: 0,
	})

	const handleAddFormChange = (event) => {
		event.preventDefault()

		const fieldName = event.target.getAttribute('name')
		const fieldValue = event.target.value
		const newFormData = { ...addFormData }
		newFormData[fieldName] = fieldValue

		setAddFormData(newFormData)
	}

	const formRef = useRef()

	const handleAddFormSubmit = (event) => {
		event.preventDefault()

		// can't use "useRef" here because input tag is not recognize as an <Input> and
		// native function "checkValidity" for instance doesn't work on "NumberFormat" component
		const peopleFieldToCheck = document.getElementById('peopleFieldinForm')

		if (peopleFieldToCheck?.value == 0) {
			peopleFieldToCheck.setCustomValidity(
				'Vous êtes au moins présent dans la voiture'
			)
			peopleFieldToCheck.reportValidity()
			return null
		} else {
			peopleFieldToCheck.setCustomValidity('')
		}

		// we have to check the form validity if we want 'required' attribute to be taken into account with preventDefault function
		const formToCheck = formRef.current

		const isValidForm = formToCheck?.checkValidity()
		if (!isValidForm) {
			formToCheck.reportValidity()
			return null
		}

		const newTrajet = { ...addFormData, id: nanoid() }
		const newTrajets = [...trajets, newTrajet]
		setTrajets(newTrajets)
	}

	return (
		<form
			aria-labelledby="trip-title"
			id="kmForm"
			ref={formRef}
			key={trajets?.length || undefined}
		>
			<h4 id="trip-title">{t('Ajouter un trajet')}</h4>
			<fieldset>
				<div
					css={`
						display: flex;
						flex-direction: row;
						flex-wrap: wrap;
						gap: 0.5rem;
						margin-top: 0.5rem;
						input,
						select {
							height: 2rem;
							border: none !important;
							outline: none !important;
						}
						select {
							transform: translateY(1px);
						}
					`}
				>
					<SelectWrapper>
						<label title="motif">
							<WrappedSelect
								className="ui__"
								css={`
									max-width: 10rem !important;
								`}
								name="motif"
								onChange={handleAddFormChange}
								required
							>
								<option value="">
									<Trans>Motif</Trans>
								</option>
								{motifList(t).map((m) => (
									<option key={m.id} value={m.name}>
										{m.name}
									</option>
								))}
							</WrappedSelect>
						</label>
					</SelectWrapper>
					<InputWrapper>
						<label title="label (facultatif)">
							<input
								className="ui__"
								css={`
									width: 10rem !important;
								`}
								name="label"
								type="text"
								placeholder={t('Label (facultatif)')}
								onChange={handleAddFormChange}
							/>
						</label>
					</InputWrapper>
					<InputWrapper>
						<label title="distance">
							<WrappedInput
								className="ui__"
								inputMode="decimal"
								allowNegative={false}
								css={`
									width: 5rem !important;
								`}
								name="distance"
								placeholder={t('Distance')}
								onChange={handleAddFormChange}
								aria-describedby="unitéDistance"
								required
							/>
						</label>
						<InputSuffix id="unitéDistance">km (A/R)</InputSuffix>
					</InputWrapper>
					<label title="fréquence">
						<SelectWrapper>
							<span
								css={`
									:focus-within {
										outline: 1px solid var(--color);
									}
								`}
							>
								<NumberFormat
									className="ui__"
									inputMode="decimal"
									allowNegative={false}
									css={`
										max-width: 2rem !important;
									`}
									name="xfois"
									onChange={handleAddFormChange}
									placeholder="x"
									required
								/>
							</span>
							<span css="padding-top: 0.25rem"> {t('fois par')} </span>
							<span
								css={`
									:focus-within {
										outline: 1px solid var(--color);
									}
								`}
							>
								<label title="période">
									<WrappedSelect
										className="ui__"
										css={`
											max-width: 10rem !important;
										`}
										name="periode"
										onChange={handleAddFormChange}
										required
									>
										<option value="">
											<Trans>période</Trans>
										</option>
										{freqList((s) => t(s, { ns: 'units' })).map((f) => (
											<option key={f.id} value={f.name}>
												{f.name}
											</option>
										))}
									</WrappedSelect>
								</label>
							</span>
							<SelectSuffix>
								<img
									src={openmojiURL('calendrier')}
									alt=""
									css="width: 1.5rem;"
								/>
							</SelectSuffix>
						</SelectWrapper>
					</label>
					<label title="nombre de personnes">
						<InputWrapper>
							<WrappedInput
								className="ui__"
								inputMode="decimal"
								allowNegative={false}
								css={`
									width: 10rem !important;
								`}
								name="personnes"
								placeholder={t('Nbre de personnes')}
								onChange={handleAddFormChange}
								id="peopleFieldinForm"
								required
							/>
							<InputSuffix>
								{' '}
								<img
									src={openmojiURL('silhouette')}
									alt=""
									css="width: 1.5rem;"
								/>
							</InputSuffix>
						</InputWrapper>
					</label>
				</div>
			</fieldset>
			<div
				css={`
					text-align: right;
				`}
			>
				<button
					form="kmForm"
					type="submit"
					className="ui__ plain small button"
					css="max-height: 2rem"
					onClick={(event) => {
						handleAddFormSubmit(event)
						trackEvent(matomoEventKilometerHelp)
					}}
				>
					<Trans>Ajouter</Trans>
				</button>
			</div>
		</form>
	)
}

const InputWrapper = styled.span`
	display: flex;
	margin: 0rem 0.4rem 0.6rem 0rem;
	background-color: white;
	color: inherit;
	font-size: inherit;
	transition: border-color 0.1s;
	position: relative;
	font-family: inherit;
	height: 2.2rem;
	border: 1px solid var(--lighterTextColor);
	border-radius: 0.3rem;
	:focus-within {
		outline: 1px solid var(--color);
	}
`

const WrappedInput = styled(NumberFormat)`
	position: relative;
	padding: 0.3rem !important;
	margin-bottom: 0rem !important;
`

const InputSuffix = styled.span`
	position: relative;
	padding: 0.2rem 0.5rem 0rem 0rem !important;
`

const SelectWrapper = styled.span`
	display: flex;
	margin: 0rem 0.4rem 0.6rem 0rem;
	background-color: white;
	color: inherit;
	font-size: inherit;
	transition: border-color 0.1s;
	position: relative;
	font-family: inherit;
	height: 2.2rem;
	border: 1px solid var(--lighterTextColor);
	border-radius: 0.3rem;
	:focus-within {
		outline: 1px solid var(--color);
	}
`

const WrappedSelect = styled.select`
	appearance: none;
	padding-right: 1.5rem !important;
	background-image: url('/images/arrow.svg');
	background-repeat: no-repeat;
	background-position: calc(100% - 0.2rem) 0.55rem;
	background-size: 1rem;
`

const SelectSuffix = styled.span`
	position: relative;
	padding: 0.2rem 0.5rem 0rem 0.2rem;
`
