import R from 'ramda'
import React, {Component} from 'react'
import Helmet from 'react-helmet'
import {formValueSelector, reset} from 'redux-form'
import {connect} from 'react-redux'
import {Redirect, Link, withRouter} from 'react-router-dom'
import classNames from 'classnames'

import {START_CONVERSATION} from '../actions'
import {createMarkdownDiv} from 'Engine/marked'
import {rules, findRuleByName, decodeRuleName} from 'Engine/rules'
import './conversation/conversation.css'
import './Simulateur.css'
import {capitalise0} from '../utils'
import Conversation from './conversation/Conversation'

import ReactPiwik from './Tracker'

let situationSelector = formValueSelector('conversation')

@withRouter
@connect(
	state => ({
		situation: variableName => situationSelector(state, variableName),
		foldedSteps: state.foldedSteps,
		unfoldedSteps: state.unfoldedSteps,
		extraSteps: state.extraSteps,
		themeColours: state.themeColours,
		analysedSituation: state.analysedSituation,
		situationGate: state.situationGate,
	}),
	dispatch => ({
		startConversation: rootVariable => dispatch({type: START_CONVERSATION, rootVariable}),
		resetForm: () => dispatch(reset('conversation'))
	})
)
export default class extends Component {
	state = {
		started: false
	}
	componentWillMount() {
		let {
				match: {
					params: {
						name: encodedName
					}
				}
			} = this.props,
			name = decodeRuleName(encodedName),
			existingConversation = this.props.foldedSteps.length > 0

		this.encodedName = encodedName
		this.name = name
		this.rule = findRuleByName(rules, name)

		// C'est ici que la génération du formulaire, et donc la traversée des variables commence
		if (!existingConversation)
			this.props.startConversation(name)
	}
	render(){
		if (!this.rule.formule) return <Redirect to={"/regle/" + this.name}/>

		let
			{started} = this.state,
			{foldedSteps, extraSteps, unfoldedSteps, situation, situationGate} = this.props,
			sim = path =>
				R.path(R.unless(R.is(Array), R.of)(path))(this.rule.simulateur || {}),
			reinitalise = () => {
				ReactPiwik.push(['trackEvent', 'restart', ''])
				this.props.resetForm(this.name)
				this.props.startConversation(this.name)
			},
			title = sim('titre') || capitalise0(this.rule['titre'] || this.rule['nom'])

		return (
			<div id="sim" className={classNames({started})}>
				<Helmet>
					<title>{title}</title>
					{sim('sous-titre') &&
						<meta name="description" content={sim('sous-titre')} />}
				</Helmet>
				<h1>{title}</h1>
				{sim('sous-titre') &&
					<div id="simSubtitle">{sim('sous-titre')}</div>
				}
				{!started && sim(['introduction', 'notes']) &&
					<div className="intro">
						{sim(['introduction', 'notes']).map( ({icône, texte, titre}) =>
							<div key={titre}>
								<i title={titre} className={"fa "+icône} aria-hidden="true"></i>
								<span>
									{texte}
								</span>
							</div>
						)}
						<button onClick={() => this.setState({started: true})}>J'ai compris</button>
					</div>
				}
				{ (started || !sim(['introduction', 'notes'])) &&
						<Conversation initialValues={ R.pathOr({},['simulateur','par défaut'], sim) } {...{foldedSteps, unfoldedSteps, extraSteps, reinitalise, situation, situationGate}}/>
				}

			</div>
		)
	}
}
