import { Trans } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getMatomoEventChangeRegion } from '../../analytics/matomo-events'
import { useMatomo } from '../../contexts/MatomoContext'
import { AppState } from '../../reducers/rootReducer'
import IllustratedMessage from '../ui/IllustratedMessage'
import CountryFlag from './CountryFlag'
import useLocalisation from './useLocalisation'
import {
	defaultModelRegionCode,
	Region,
	useCountryNameInCurrentLang,
	useSupportedRegion,
} from './utils'

export default (): JSX.Element => {
	const { trackEvent } = useMatomo()
	const messagesRead = useSelector(
		(state: AppState) => state.sessionLocalisationBannersRead
	)
	const dispatch = useDispatch()
	const localisation = useLocalisation()
	const currentLang = useSelector(
		(state: AppState) => state.currentLang
	).toLowerCase()
	const code = localisation?.country?.code
	const regionParams: Region | undefined = useSupportedRegion(code)
	const countryName = useCountryNameInCurrentLang(localisation)

	const versionName = regionParams
		? regionParams[currentLang]['gentilé'] ?? regionParams[currentLang]['nom']
		: localisation?.country?.name

	if (messagesRead.includes(code)) return

	if (code === defaultModelRegionCode) return

	return (
		<IllustratedMessage
			emoji="📍"
			width="32rem"
			direction="row"
			backgroundcolor="#fff8d3"
			message={
				<div>
					{regionParams ? (
						<p>
							<Trans
								i18nKey={'components.localisation.LocalisationMessage.version'}
							>
								Vous utilisez la version <strong>{{ versionName }}</strong> du
								test
							</Trans>
							<CountryFlag code={code} />.
							{code !== defaultModelRegionCode && (
								<span>
									{' '}
									<Trans i18nKey="components.localisation.LocalisationMessage.betaMsg">
										Elle est actuellement en version <strong>bêta</strong>.
									</Trans>
								</span>
							)}{' '}
						</p>
					) : localisation ? (
						<p>
							<Trans>
								Nous avons détecté que vous faites cette simulation depuis
							</Trans>{' '}
							{countryName}
							<CountryFlag code={code} />.
							<p css="margin-top: 0.5rem">
								<b>
									<Trans i18nKey="components.localisation.LocalisationMessage.warnMessage">
										Votre région n'est pas encore supportée, le modèle Français
										vous est proposé par défaut
									</Trans>
								</b>
								<CountryFlag code={defaultModelRegionCode} />
								<b>.</b>
							</p>
						</p>
					) : (
						<p>
							<Trans i18nKey="components.localisation.LocalisationMessage.warnMessage2">
								Nous n'avons pas pu détecter votre pays de simulation, le modèle
								Français vous est proposé par défaut
							</Trans>
							<CountryFlag code={defaultModelRegionCode} />.
						</p>
					)}
					<p>
						{localisation && regionParams ? (
							<small>
								<Trans>Pas votre région ?</Trans>{' '}
								<Link to="/profil">
									<Trans>Choisissez la vôtre</Trans>
								</Link>
								.
							</small>
						) : (
							<small>
								<Link to="/profil">
									<Trans>
										Choisissez une région parmi celles disponibles !
									</Trans>
								</Link>
							</small>
						)}
					</p>
					<button
						className="ui__ button plain small "
						css={`
							margin-left: auto;
							margin-right: 0rem;
							display: block !important;
						`}
						onClick={() => {
							dispatch({
								type: 'SET_LOCALISATION_BANNERS_READ',
								regions: [...messagesRead, code],
							})

							trackEvent(getMatomoEventChangeRegion(code))
						}}
					>
						<Trans>J'ai compris</Trans>
					</button>
				</div>
			}
			inline={undefined}
			image={undefined}
		/>
	)
}
