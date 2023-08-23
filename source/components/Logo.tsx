import { Link } from 'react-router-dom'

export default ({ showText, size = 'large' }) => (
	<div
		css={`
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
		`}
	>
		<Link
			to="/"
			data-cypress-id="home-logo-link"
			css={`
				display: flex;
				align-items: center;
				justify-content: center;
				text-decoration: none;
				margin: ${{
					large: '1rem auto',
					medium: '1rem 3rem 0rem 0rem',
					small: '.1rem auto',
				}[size]};
				img {
					width: ${{ large: '100px', medium: '55px', small: '30px' }[size]};
					height: auto;
				}
			`}
		>
			<img
				src={`/images/petit-logo${size === 'large' ? '@2x' : ''}.png`}
				srcSet="/images/petit-logo@2x.png 2x,
							/images/petit-logo@3x.png 3x"
				width="75"
				height="75"
			/>
			{showText && (
				<div
					css={`
						font-weight: 900;
						line-height: ${{
							large: '1.5rem',
							medium: '1.05rem',
							small: '1rem',
						}[size]};
						color: var(--darkColor);
						text-transform: uppercase;
						font-size: ${{ large: '160%', medium: '113%', small: '60%' }[size]};
						margin-left: 0.2rem;
					`}
				>
					Nos
					<br />
					Gestes
					<br />
					Climat
				</div>
			)}
		</Link>
	</div>
)
