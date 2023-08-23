import { Simulation } from './simulation'

export type Member = {
	_id: string
	name: string
	email?: string
	simulation: Simulation
	userId: string
	results: SimulationResults
}

export type Group = {
	_id: string
	name: string
	emoji: string
	members: Member[]
	owner: {
		_id: string
		name: string
		email?: string
		userId: string
	}
}

export type SimulationResults = {
	total: string
	'transport . empreinte': {
		value: string
		variation: string
	}
	transports: {
		value: string
		variation: string
	}
	alimentation: {
		value: string
		variation: string
	}
	logement: {
		value: string
		variation: string
	}
	divers: {
		value: string
		variation: string
	}
	'services sociétaux': {
		value: string
		variation: string
	}
}
