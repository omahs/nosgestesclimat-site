import AnimatedLoader from '@/AnimatedLoader'
import Title from '@/components/groupe/Title'
import AutoCanonicalTag from '@/components/utils/AutoCanonicalTag'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default () => {
	const { t } = useTranslation()
	const title = t('Statistiques Northstar')

	const iFrameRef = useRef(null)
	const [isIFrameLoaded, setIsIFrameLoaded] = useState(false)
	useEffect(() => {
		const iframeCurrent = iFrameRef.current
		iframeCurrent?.addEventListener('load', () => setIsIFrameLoaded(true))
		return () => {
			iframeCurrent?.removeEventListener('load', () => setIsIFrameLoaded(true))
		}
	}, [iFrameRef])

	return (
		<div className={'ui__ container fluid'}>
			<Title title={title} />
			<AutoCanonicalTag />
			<p>
				{t(
					'Le chargement prend parfois plusieurs minutes, visualiser ce dashboard demande un peu de patience ! 🕙'
				)}
			</p>
			{!isIFrameLoaded && <AnimatedLoader />}
			<iframe
				ref={iFrameRef}
				id="iframe-metabase-northstar"
				title="Statistiques Northstar Metabase"
				src="https://metabase-ngc.osc-fr1.scalingo.io/public/dashboard/0f6974c5-1254-47b4-b6d9-6e6f22a6faf7"
				width="100%"
				height="1800px"
				css={`
					border: none;
				`}
			></iframe>
		</div>
	)
}
