import { Trans, useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Chart from './content/Chart'
import DurationChart from './content/DurationChart'
import DurationFigures from './content/DurationFigures'
import Evolution, {
	Block,
	BlockWrapper,
	Number,
	Wrapper as EvolutionWrapper,
} from './content/Evolution'
import IframeFigures from './content/IframeFigures'
import KmFigures from './content/KmFigures'
import ScoreFromURL from './content/ScoreFromURL'
import Sources from './content/Sources'
import {
	useActiveEntryPages,
	useAllTime,
	useEntryPages,
	useGetSharedSimulationEvents,
	useHomepageVisitors,
	useKeywords,
	useKmHelp,
	useOldWebsites,
	usePages,
	usePeriod,
	useReference,
	useRidesNumber,
	useSimulationsfromKmHelp,
	useSimulationsTerminees,
	useSocials,
	useTotal,
	useVisitsAvgDuration,
	useVisitsDuration,
	useWebsites,
} from './matomo'

import Title from '../groupe/Title'
import Section from './utils/Section'

const Wrapper = styled.div`
	display: flex;
	width: 100%;
	margin-bottom: 2rem;

	@media screen and (max-width: ${1200}px) {
		flex-direction: column;
	}
`

// Do not try [toRenderWithRequestData]  until all [requestResults] are successful.
// Otherwise, an informative message in rendered.
const UseQueryResultHandler = ({ requestResults, toRenderWithRequestData }) => {
	const notSuccessfulRequests = requestResults.filter(
		({ isSuccess }) => !isSuccess
	)

	if (notSuccessfulRequests.length > 0) {
		return (
			<div>
				{notSuccessfulRequests.map(({ error, isError, isLoading }) => {
					if (isError) {
						return (
							<p
								key={JSON.stringify(error)}
								css={`
									font-size: small;
									font-style: italic;
									color: #ff3831;
								`}
							>
								<Trans>
									Une erreur est survenue lors de la récupération des données
								</Trans>{' '}
								: {error.message}
							</p>
						)
					}
					if (isLoading) {
						return (
							<p
								key={JSON.stringify(error)}
								css={`
									font-size: small;
									font-style: italic;
								`}
							>
								<Trans>Récupération des données</Trans>...
							</p>
						)
					}
				})}
			</div>
		)
	}

	return toRenderWithRequestData(requestResults.map(({ data }) => data))
}

export default function Data() {
	const total = useTotal()
	const simulations = useSimulationsTerminees()
	const duration = useVisitsDuration()
	const avgduration = useVisitsAvgDuration()
	const websites = useWebsites()
	const oldWebsites = useOldWebsites()
	const socials = useSocials()
	const keywords = useKeywords()
	const period = usePeriod()
	const reference = useReference()
	const entryPages = useEntryPages()
	const activeEntryPages = useActiveEntryPages()
	const pages = usePages()
	const allTime = useAllTime()
	const kmhelp = useKmHelp()
	const simulationsfromhelp = useSimulationsfromKmHelp()
	const ridesnumber = useRidesNumber()
	const homepageVisitorsData = useHomepageVisitors()
	const sharedSimulations = useGetSharedSimulationEvents()

	const { t } = useTranslation()

	return (
		<div>
			<Title title={<Trans>Statistiques</Trans>} />
			<Section>
				<Section.Title>
					<Trans>Générales</Trans>
				</Section.Title>
				<UseQueryResultHandler
					requestResults={[period, reference, allTime, simulations]}
					toRenderWithRequestData={([
						periodData,
						referenceData,
						allTimeData,
						simulationsData,
					]) => (
						<Wrapper>
							<Evolution
								period={periodData.value}
								reference={referenceData.value}
								allTime={allTimeData.value}
								simulations={simulationsData}
							/>
							<Chart elementAnalysedTitle={t('visites')} />
						</Wrapper>
					)}
				/>
				<Wrapper>
					<EvolutionWrapper
						css={`
							padding-top: 1rem;
						`}
					>
						<BlockWrapper
							css={`
								margin-bottom: 1rem;
							`}
						>
							<Block>
								<Number>
									{homepageVisitorsData?.data?.[0]?.nb_visits
										?.toString()
										?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') || (
										<span
											css={`
												color: grey;
												font-size: 0.5rem;
											`}
										>
											Chargement...
										</span>
									)}
								</Number>{' '}
								&nbsp;<Trans>visites sur la page d'accueil</Trans>
							</Block>
						</BlockWrapper>
						<BlockWrapper>
							<Block>
								<Number>
									{sharedSimulations?.data?.[0]?.nb_events || (
										<span
											css={`
												color: grey;
												font-size: 0.5rem;
											`}
										>
											Chargement...
										</span>
									)}
								</Number>{' '}
								&nbsp;<Trans>partages du site</Trans>
							</Block>
						</BlockWrapper>
					</EvolutionWrapper>
					<Chart
						name="chart-simulation-terminees"
						elementAnalysedTitle={t('simulations terminées')}
						target="Events.getAction&label=A%20termin%C3%A9%20la%20simulation%0A"
						tooltipLabel={t('simulations terminées')}
						key="chart-simulation-terminees"
						color="#30C691"
					/>
				</Wrapper>
				<UseQueryResultHandler
					requestResults={[total, websites, oldWebsites, socials, keywords]}
					toRenderWithRequestData={([
						totalData,
						websitesData,
						oldWebsitesData,
						socialsData,
						keywordsData,
					]) => (
						<Sources
							total={totalData.value}
							websites={websitesData}
							oldWebsites={oldWebsitesData}
							socials={socialsData}
							keywords={keywordsData}
						/>
					)}
				/>
			</Section>
			<Section>
				<Section.Title>
					<Trans>Intégrations et Iframes</Trans>
				</Section.Title>
				<Section.Intro>
					<Trans i18nKey={'components.stats.StatsContent.integrationEtIframes'}>
						<summary>En savoir plus</summary>
						<p>
							Les intégrations en iframe sont détéctées via le paramètre
							'iframe' dans l'URL, ceci seulement si l'intégrateur a utilisé le{' '}
							<a href="./diffuser">script dédié</a>. Ainsi, les visites via les
							iframes d'intégrateurs qui n'ont pas utilisé ce script sont
							dispersées dans les visites générales de Nos Gestes Climat. Dans
							l'attente de chiffres plus précis, ce taux est donc
							potentiellement sous-estimé par rapport à la réalité.{' '}
							<i>(Données valables pour les 30 derniers jours)</i>
						</p>
					</Trans>
				</Section.Intro>
				<UseQueryResultHandler
					requestResults={[entryPages, activeEntryPages]}
					toRenderWithRequestData={([entryPagesData, activeEntryPagesData]) => (
						<Wrapper>
							<IframeFigures
								pages={entryPagesData}
								activePages={activeEntryPagesData}
							/>
						</Wrapper>
					)}
				/>
			</Section>
			<Section>
				<Section.Title>
					<Trans>Northstar: les statistiques "étoile du nord"</Trans>
				</Section.Title>
				<Trans i18nKey={'components.stats.StatsContent.infosNorthstar'}>
					<p>
						En fin de simulation, une bannière apparaît afin de recueillir le
						sentiment de nos utilisateurs sur le rôle de Nos Gestes Climat dans
						leur compréhension des enjeux climat mais également dans
						l'incitation au passage à l'action via 2 questions en fin de test.
						Les statistiques, disponibles sur la page dédiée{' '}
						<a href="./northstar">page dédiée "Northstar"</a>, ont été générées
						via Metabase.
					</p>
				</Trans>
			</Section>
			<Section>
				<Section.Title>
					<Trans>Durée des visites</Trans>
				</Section.Title>
				<Section.Intro>
					<Trans i18nKey={'components.stats.StatsContent.dureeDesVisites'}>
						<summary>En savoir plus</summary>
						<p>
							Cette section est générée à partir des visites des 60 derniers
							jours. Les visites dont le temps passé sur le site est inférieur à
							1 minute ont été écartées. Pour éviter le biais de l'iframe qui
							peut générer des visiteurs inactifs dans les statistiques, le
							temps moyen sur le site a été calculé à partir des visites actives
							(l'utilisateur a cliqué sur "Faire le test").
						</p>
					</Trans>
				</Section.Intro>
				<UseQueryResultHandler
					requestResults={[avgduration]}
					toRenderWithRequestData={([avgdurationData]) => (
						<Wrapper>
							<DurationFigures avgduration={avgdurationData} />
							{duration.isSuccess && <DurationChart duration={duration.data} />}
						</Wrapper>
					)}
				/>
			</Section>
			<Section>
				<Section.Title>
					<Trans>Score de nos utilisateurs</Trans>
				</Section.Title>
				<Section.Intro>
					<Trans i18nKey={'components.stats.StatsContent.scoreUtilisateurs'}>
						<summary>En savoir plus</summary>
						<p>
							Bien sûr, nous ne collectons pas{' '}
							<a href="/vie-priv%C3%A9e">les données utlisateurs</a>. Néanmoins,
							le score total ainsi que l'empreinte par catégorie est présente
							dans l'URL de fin de test. Dans cette section, nous agrégeons cees
							informations pour avoir une idée de l'empreinte carbone moyenne de
							nos utilisateurs et de distribution du score afin d'analyser ces
							résultats dans le contexte des évolutions du modèle.
						</p>{' '}
						<p>
							L'objectif ici n'est pas d'évaluer l'empreinte carbone des
							Français : à priori, les utilisateurs du tests de sont pas
							représentatifs des Français. De plus, ces données peuvent être
							biaisées par des utilisateurs qui reviendraient à plusieurs
							reprises sur la page de fin, en changeant ses réponses au test (ce
							qui crée de nouveaux url de fin).
						</p>
					</Trans>
				</Section.Intro>
				<UseQueryResultHandler
					requestResults={[pages]}
					toRenderWithRequestData={([pagesData]) => (
						<Wrapper>
							<ScoreFromURL pages={pagesData} />
						</Wrapper>
					)}
				/>
			</Section>
			<Section>
				<Section.Title>
					<Trans>La voiture en chiffres</Trans>
				</Section.Title>
				<UseQueryResultHandler
					requestResults={[kmhelp, simulationsfromhelp, ridesnumber]}
					toRenderWithRequestData={([
						kmhelpData,
						simulationsfromhelpData,
						ridesnumberData,
					]) => (
						<KmFigures
							kmhelp={kmhelpData}
							simulationsfromhelp={simulationsfromhelpData?.nb_visits}
							ridesnumber={ridesnumberData?.nb_events}
						/>
					)}
				/>
			</Section>
		</div>
	)
}
