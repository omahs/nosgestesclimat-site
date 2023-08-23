import { NETLIFY_FUNCTIONS_URL } from '@/constants/urls'
import { useGetCurrentSimulation } from '@/hooks/useGetCurrentSimulation'
import { emailSimulationURL } from '@/sites/publicodes/conference/useDatabase'
import { Simulation } from '@/types/simulation'
import * as Sentry from '@sentry/react'
import { formatValue } from 'publicodes'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { formatDataForDB } from '../utils/formatDataForDB'

export const NewsletterForm = () => {
	const [isSent, setIsSent] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const [error, setError] = useState(false)
	const [numberSubscribers, setNumberSubscribers] = useState<
		number | undefined
	>(undefined)

	const { t } = useTranslation()

	const currentSimulation = useGetCurrentSimulation()

	const saveSimulationInDB = async (data: Simulation) => {
		const dataFormatted = { ...data }

		if (dataFormatted.situation) {
			dataFormatted.situation = formatDataForDB(dataFormatted)
		}

		try {
			const response = await fetch(emailSimulationURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: dataFormatted,
				}),
			})

			const simulationSaved = await response.json()
			return simulationSaved
		} catch (e) {
			Sentry.captureException(e)
		}
	}

	useEffect(() => {
		const handleFetch = async () => {
			try {
				const data = await fetch(
					`${NETLIFY_FUNCTIONS_URL}/get-newsletter-subscribers-number`
				)
				const result: number = await data.json()
				setNumberSubscribers(result)
			} catch (e) {
				Sentry.captureException(e)
			}
		}
		handleFetch()
	}, [])

	const handleSubmit = async (e) => {
		e.preventDefault()
		setIsSending(true)

		try {
			if (!currentSimulation) {
				setError(t("Vous n'avez pas de simulation en cours à sauvegarder."))
				return
			}

			// Save simulation in DB
			const idSimulationSaved: string = await saveSimulationInDB(
				currentSimulation as unknown as Simulation
			)

			await fetch(`${NETLIFY_FUNCTIONS_URL}/email-service`, {
				method: 'POST',
				body: JSON.stringify({
					email: (document.getElementById('EMAIL') as HTMLInputElement).value,
					optIn: (document.getElementById('OPT_IN') as HTMLInputElement).value,
					simulationURL:
						location.toString().replace('/fin', '/mon-empreinte-carbone') +
						`&sid=${encodeURIComponent(
							idSimulationSaved
						)}&mtm_campaign=retrouver-ma-simulation`,
					// URL already contains the query param details
					shareURL:
						location
							.toString()
							.replace('/fin', '/mon-empreinte-carbone/partage') +
						'&mtm_campaign=partage-email',
				}),
			})

			setIsSent(true)
		} catch (e) {
			Sentry.captureException(e)
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div
			css={`
				text-align: center;
				border-radius: 0.5rem;
				width: 35rem;
				max-width: 100%;
				margin: 0 auto;
				margin-top: 1.5rem;
				position: relative;
			`}
			id="newsletter-form-container"
		>
			<div>
				<div css="text-align:center; max-width:540px; margin: 0 auto;">
					{isSent ? (
						<div css="padding: 8px 0; padding-top: 1rem;">
							<div css="font-size:1.5rem; text-align:left; font-weight:700; color:#3C4858; background-color:transparent; text-align:left">
								<p>
									<Trans>Merci pour votre inscription !</Trans> 🌱
								</p>
							</div>
							<p
								css={`
									text-align: left;
									margin-top: 1rem;
								`}
							>
								<Trans>
									Vous allez recevoir un email de notre part sous peu.
								</Trans>
							</p>
						</div>
					) : (
						<form
							id="newsletter-form"
							onSubmit={handleSubmit}
							css={`
								margin: 0 auto;
								box-sizing: border-box;
								position: relative;
								padding-top: 0.5rem;
							`}
						>
							<div css="padding: 8px 0;">
								<div css="font-size:1.25rem; text-align:left; font-weight:700; color:#3C4858; background-color:transparent; text-align:left">
									<p>
										<Trans>Vous souhaitez recevoir vos résultats ?</Trans> 💡
									</p>
								</div>
							</div>
							<div css="padding: 8px 0;">
								<div css="font-size:16px; text-align:left; color:#3C4858; background-color:transparent; text-align:left">
									<div>
										<p>
											<Trans>Laissez-nous votre email</Trans>
											{numberSubscribers && (
												<span>
													<Trans>, comme déjà </Trans>
													<strong>
														{formatValue(numberSubscribers)}{' '}
														<Trans>autres utilisateurs, </Trans>
													</strong>
												</span>
											)}
											<Trans> pour recevoir </Trans>
											<strong>
												<Trans>votre résultat</Trans>
											</strong>{' '}
											<Trans>et </Trans>
											<strong>
												<Trans>des conseils</Trans>
											</strong>{' '}
											<Trans>
												pour réduire votre empreinte carbone (1 fois par mois
												max.).{' '}
											</Trans>
										</p>
									</div>
								</div>
							</div>
							<div css="padding: 8px 0; text-align: left;">
								<div>
									<div>
										<div>
											<label
												css="font-weight: 700; text-align:left; font-size:16px; text-align:left; font-weight:700; color:#3c4858;"
												data-required="*"
												htmlFor="EMAIL"
											>
												<Trans>Entrez votre adresse email</Trans>
											</label>

											<div>
												<input
													className="input ui__ field"
													type="text"
													id="EMAIL"
													name="EMAIL"
													placeholder="Email"
													data-required="true"
													required
													disabled={isSending}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div css="padding: 8px 0;">
								<div>
									<div>
										<div>
											<div>
												<label css="display: flex; gap: 0.15rem; align-items: flex-start;">
													<input
														type="checkbox"
														value="1"
														id="OPT_IN"
														name="OPT_IN"
														required
														disabled={isSending}
													/>
													<span css="margin-left:"></span>
													<span css="font-size:14px; text-align:left; color:#3C4858; background-color:transparent;">
														<Trans>
															<p>
																J'accepte de recevoir des informations de la
																part de Nos Gestes Climat et sa{' '}
																<a
																	target="_blank"
																	href="https://nosgestesclimat.fr/vie-privée"
																	aria-label={t(
																		'politique de confidentialité, nouvelle fenêtre'
																	)}
																>
																	politique de confidentialité
																</a>
															</p>
														</Trans>
													</span>{' '}
												</label>
											</div>
										</div>
										<p css="font-size:12px; color:#8390A4; line-height: 1rem; display: flex; justify-content: flex-start; align-items: flex-start; text-align: left;">
											<Trans>
												Vous pourrez choisir de ne plus recevoir nos emails à
												tout moment
											</Trans>
										</p>
									</div>
									{error && (
										<div
											css={`
												padding: 8px 0;
												text-align: left;
												color: #d82424;
												font-size: 0.75rem;
											`}
										>
											{error}
										</div>
									)}
								</div>
							</div>

							<div css="padding: 8px 0;">
								<div css="text-align: left">
									<button
										className="ui__ button plain small"
										form="newsletter-form"
										type="submit"
										disabled={isSending}
									>
										<Trans>Envoyer</Trans>
									</button>
								</div>
							</div>
							<input
								type="text"
								name="email_address_check"
								value=""
								css={`
									visibility: hidden;
								`}
								readOnly
							/>
							<input type="hidden" name="locale" value="en" readOnly />
							<input type="hidden" name="html_type" value="simple" readOnly />
						</form>
					)}
				</div>
			</div>
		</div>
	)
}
