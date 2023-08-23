import {
	DottedName,
	extractCategories,
	getSubcategories,
} from '@/components/publicodesUtils'
import {
	setSituationForValidKeys,
	useEngine,
} from '@/components/utils/EngineContext'
import { Member } from '@/types/groups'
import Engine from 'publicodes'

export type ValueObject = {
	title: string
	value: number
	mean?: number
	name: string
	variation?: number
	icon?: string
	isCategory?: boolean
}

type Points = {
	key: string
	resultObject: ValueObject
}

export type Results = {
	currentMemberAllFootprints: Record<string, ValueObject>
	groupCategoriesFootprints: Record<string, ValueObject>
	pointsForts: Points[]
	pointsFaibles: Points[]
}

const getVariation = ({ value, mean }: { value: number; mean: number }) => {
	return ((value - (mean || 0)) / (mean || 1)) * 100
}

export const useGetGroupStats = ({
	groupMembers,
	userId,
	synced,
}: {
	groupMembers: Member[] | undefined
	userId: string | null
	synced: boolean
}) => {
	const engine: Engine<DottedName> = useEngine()

	const rules = engine.getParsedRules()

	if (!groupMembers || !userId || !synced) return null

	const results = {
		currentMemberAllFootprints: {} as Record<string, ValueObject>,
		groupCategoriesFootprints: {},
		pointsForts: {} as Points[],
		pointsFaibles: {} as Points[],
	}

	const { groupCategoriesFootprints, currentMemberAllFootprints } = groupMembers
		// We sort the members to have the current user as last to set the engine
		.sort((a) => (a.userId === userId ? 1 : -1))
		.reduce(
			(
				{ groupCategoriesFootprints, currentMemberAllFootprints },
				groupMember: Member
			) => {
				// Create a copy of the accumulator
				const updatedGroupCategoriesFootprints = {
					...groupCategoriesFootprints,
				}
				const updatedCurrentMemberAllFootprints = {
					...currentMemberAllFootprints,
				}

				const isCurrentMember = groupMember.userId === userId

				setSituationForValidKeys({
					engine,
					situation: groupMember?.simulation?.situation,
				})

				const categories = extractCategories(rules, engine)

				categories.forEach((category) => {
					// If the category is not in the accumulator, we add its name as a new key in the object along with its value
					// otherwise we add the value to the existing sum
					if (!updatedGroupCategoriesFootprints[category.name]) {
						updatedGroupCategoriesFootprints[category.name] = {
							title: category.title,
							value: category.nodeValue as number,
							icon: rules[category?.name]?.rawNode?.icônes,
							isCategory: true,
						}
					} else {
						updatedGroupCategoriesFootprints[category.name].value +=
							category.nodeValue as number
					}

					// Add each category footprint for the current member
					if (isCurrentMember) {
						updatedCurrentMemberAllFootprints[category.name] = {
							title: category.title,
							value: category.nodeValue as number,
							icon: rules[category?.name]?.rawNode?.icônes,
							isCategory: true,
						}
					}

					getSubcategories(rules, category, engine, true).forEach(
						(subCategory) => {
							// Same here if the property doesn't exist in the accumulator, we add it
							// otherwise we add the value to the existing sum
							if (!updatedGroupCategoriesFootprints[subCategory.name]) {
								updatedGroupCategoriesFootprints[subCategory.name] = {
									title: subCategory.title,
									value: subCategory.nodeValue as number,
									icon: rules[subCategory?.name]?.rawNode?.icônes,
								}
							} else {
								updatedGroupCategoriesFootprints[subCategory.name].value +=
									subCategory.nodeValue as number
							}
							if (isCurrentMember) {
								// Add each category footprint for the current member
								updatedCurrentMemberAllFootprints[subCategory.name] = {
									title: subCategory.title,
									value: subCategory.nodeValue as number,
									icon:
										rules[subCategory?.name]?.rawNode?.icônes ??
										rules[category?.name]?.rawNode?.icônes,
								}
							}
						}
					)
				})

				return {
					groupCategoriesFootprints: updatedGroupCategoriesFootprints,
					currentMemberAllFootprints: updatedCurrentMemberAllFootprints,
				}
			},
			{ groupCategoriesFootprints: {}, currentMemberAllFootprints: {} }
		)

	results.groupCategoriesFootprints = groupCategoriesFootprints
	results.currentMemberAllFootprints = currentMemberAllFootprints

	// Calculate the mean for the group for each category
	Object.keys(results.groupCategoriesFootprints).forEach((key) => {
		// Calculate mean for the group for each category
		results.groupCategoriesFootprints[key].mean =
			results.groupCategoriesFootprints[key].value / groupMembers.length
	})

	// Calculate the current user variation between its value and the group mean for each category
	// and subcategory
	Object.keys(results.currentMemberAllFootprints).forEach((key) => {
		results.currentMemberAllFootprints[key].variation = getVariation({
			value: results.currentMemberAllFootprints[key].value,
			mean: results.groupCategoriesFootprints[key]?.mean,
		})
	})

	const sortedCurrentMemberByVariation = Object.entries(
		results.currentMemberAllFootprints
	)
		.filter(
			([key, resultObject]) =>
				!resultObject?.isCategory &&
				resultObject?.value &&
				// We don't want to display the "services publics" category
				key !== 'services publics'
		)
		.map(([key, resultObject]) => ({ key, resultObject }))
		.sort((a, b) => {
			if (a?.resultObject?.value === b?.resultObject?.value) {
				return 0
			}

			return (b?.resultObject?.variation || 0) >
				(a?.resultObject?.variation || 0)
				? -1
				: 1
		}) as Points[]

	results.pointsForts = sortedCurrentMemberByVariation.slice(0, 2)
	results.pointsFaibles = sortedCurrentMemberByVariation.slice(-3)

	return results as Results
}
