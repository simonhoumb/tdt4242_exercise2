export function EthicalGuidanceCard({ title, message, guidancePoints }) {
	return (
		<section className="card" aria-live="polite">
			<h2>{title}</h2>
			<p className="info">{message}</p>
			<ul>
				{guidancePoints.map((point) => (
					<li key={point}>{point}</li>
				))}
			</ul>
		</section>
	);
}
