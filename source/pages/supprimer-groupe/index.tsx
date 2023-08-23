import { removeGroupFromUser } from '@/actions/actions'
import Button from '@/components/groupe/Button'
import Title from '@/components/groupe/Title'
import AutoCanonicalTag from '@/components/utils/AutoCanonicalTag'
import { GROUP_URL } from '@/constants/urls'
import { Group } from '@/types/groups'
import { captureException } from '@sentry/react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

export default function SupprimerDonnees() {
	const [hasDeleted, setHasDeleted] = useState(false)
	const [shouldRedirect, setShouldRedirect] = useState(false)
	const [group, setGroup] = useState<Group>()
	const [errorGroup, setErrorGroup] = useState('')

	const dispatch = useDispatch()

	const navigate = useNavigate()

	const [searchParams] = useSearchParams()

	const groupId = searchParams.get('groupId')
	const userId = searchParams.get('userId')

	const { t } = useTranslation()

	const handleDelete = async () => {
		if (!group) return
		try {
			await fetch(`${GROUP_URL}/delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					groupId,
					userId,
				}),
			})

			dispatch(removeGroupFromUser(group))

			setHasDeleted(true)
		} catch (error) {
			captureException(error)
		}
	}

	useEffect(() => {
		// Redirect to landing if no groupId or userId
		if (!groupId || !userId) {
			setShouldRedirect(true)
			return
		}

		const handleFetchGroup = async () => {
			try {
				const response = await fetch(`${GROUP_URL}/${groupId}`)

				if (!response.ok) {
					throw new Error('Error while fetching group')
				}

				const groupFetched: Group = await response.json()

				// Redirect to landing if user is not in group
				if (
					groupFetched.members.findIndex((member) => member.userId === userId) <
					0
				) {
					setShouldRedirect(true)
					return
				}

				setGroup(groupFetched)
			} catch (error) {
				setErrorGroup(
					t(
						"Oups, une erreur s'est produite au moment de récupérer les données du groupe."
					)
				)
			}
		}

		// Verify group and user existence
		handleFetchGroup()
	}, [groupId, userId, t])

	const isOwner = group?.owner?.userId === userId

	if (shouldRedirect) {
		navigate('/')
	}

	if (!groupId) {
		return <Navigate to="/groupes" />
	}

	return (
		<main className="p-4 md:p-8">
			<AutoCanonicalTag />
			<Title title={t('Supprimer mes données')} />
			{hasDeleted && <Trans>Données supprimées.</Trans>}
			{!hasDeleted && (
				<p className="my-4">
					{isOwner ? (
						<Trans>
							Supprimer votre groupe <strong>{group?.name}</strong> ? Les
							données sauvegardées seront supprimées pour tous les membres du
							groupe. Cette action est irréversible.
						</Trans>
					) : (
						<Trans>
							Supprimer vos données de groupe enregistrées ? Seules vos données
							de membre seront supprimées. Cette action est irréversible.
						</Trans>
					)}
				</p>
			)}

			{errorGroup && <p className="text-red-600 mt-4">{errorGroup}</p>}

			<Button
				disabled={!!errorGroup || !group || hasDeleted}
				onClick={handleDelete}
			>
				<Trans>Supprimer mes données</Trans>
			</Button>
		</main>
	)
}
