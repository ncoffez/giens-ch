<script lang="ts" setup>
import type { FeatureCard, JourneyStep, StatItem } from "../../types";
import { htmlForLocale } from "~/utils/htmlForLocale";

const { t, locale } = useI18n();

const destinationAddress = "Avenue des Arbanais 313, 83400 Hyeres, France";
const destinationQuery = "Lotissement Beausoleil, Avenue des Arbanais 313, Hyeres";
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(destinationQuery)}&output=embed`;
const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;

const defaultLage = computed(() => htmlForLocale(locale.value, { de: `<p>Unsere Ferienhäuser liegen idyllisch auf der Halbinsel von Giens an der Avenue des Arbanais 313, nur etwa 15 Gehminuten vom Strand und vom Dorfzentrum entfernt.</p><p>Die Halbinsel von Giens befindet sich bei etwa 43°2′ nördlicher Breite an der Côte d'Azur im Département Var und gehört zu den südlichen Regionen des französischen Festlands.</p><p>Ein großer Teil der Halbinsel ist als Naturschutzgebiet ausgewiesen und steht unter besonderem Schutz. Besonders die Salinen und Feuchtgebiete zwischen den beiden Sanddämmen (Tombolos) bilden ein wichtiges Rückzugsgebiet für Zug- und Brutvögel.</p>`, fr: `<p>Nos maisons de vacances sont idylliquement situées sur la presqu'île de Giens, Avenue des Arbanais 313, à seulement environ 15 minutes à pied de la plage et du centre du village.</p><p>La presqu'île de Giens se trouve à environ 43°2′ de latitude nord sur la Côte d'Azur, dans le département du Var, et fait partie des régions les plus méridionales de la France métropolitaine.</p><p>Une grande partie de la presqu'île est classée en réserve naturelle et bénéficie d'une protection particulière. Les salines et les zones humides entre les deux cordons littoraux (tombolos) constituent un refuge important pour les oiseaux migrateurs et nicheurs.</p>` }));

const defaultAuto = computed(() => htmlForLocale(locale.value, { de: `<p>Die Anreise mit dem Auto ab Bern ist für viele Bewohner des Lotissement Beausoleil eine bevorzugte Option. Die Strecke führt hauptsächlich über Autobahnen und beträgt etwa 700 km. Die Fahrtzeit beträgt je nach Verkehr und Pausen etwa 7 bis 8 Stunden.</p>`, fr: `<p>Le trajet en voiture depuis Berne est, pour de nombreux habitants du Lotissement Beausoleil, l'option privilégiée. L'itinéraire emprunte principalement des autoroutes et compte environ 700 km. Selon le trafic et les pauses, le trajet dure environ 7 à 8 heures.</p>` }));

const defaultZug = computed(() => htmlForLocale(locale.value, { de: `<p>Die Anreise mit dem Zug ist eine bequeme Alternative. SNCF bietet hervorragende Verbindungen mit dem TGV an, oft mit nur zwei Umstiegen ab der Schweiz.</p>`, fr: `<p>Le voyage en train est une alternative confortable. La SNCF propose d'excellentes liaisons TGV, souvent avec seulement deux correspondances depuis la Suisse.</p>` }));

const defaultFlugzeug = computed(() => htmlForLocale(locale.value, { de: `<p>Der Flughafen <strong>Toulon-Hyères (TLN)</strong> liegt nur 15 Minuten von Giens entfernt und ist ideal für Kurztrips.</p><p>Alternativ bietet sich der Flughafen <strong>Marseille (MRS)</strong> an, der von Zürich oder Genf oft mehrmals täglich direkt angeflogen wird. Die Weiterreise nach Giens dauert von dort etwa 1h 15min mit dem Auto.</p>`, fr: `<p>L'aéroport <strong>Toulon-Hyères (TLN)</strong> se trouve à seulement 15 minutes de Giens et convient parfaitement aux courts séjours.</p><p>En alternative, l'aéroport <strong>Marseille (MRS)</strong> est souvent desservi plusieurs fois par jour depuis Zurich ou Genève. Le trajet jusqu'à Giens dure ensuite environ 1 h 15 en voiture.</p>` }));

const defaultRouteFacts: StatItem[] = [
	{ value: "700 km", label: t("travel.intro.facts.distance") },
	{ value: "7-8 h", label: t("travel.intro.facts.drive") },
	{ value: "15 min", label: t("travel.intro.facts.airport") },
];

const defaultPlanningPillars: FeatureCard[] = [
	{
		title: t("travel.intro.pillars.drive.title"),
		description: t("travel.intro.pillars.drive.description"),
		icon: "i-lucide-car",
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		title: t("travel.intro.pillars.train.title"),
		description: t("travel.intro.pillars.train.description"),
		icon: "i-lucide-train-front",
		bgColor: "emerald",
		iconColor: "emerald",
	},
	{
		title: t("travel.intro.pillars.flight.title"),
		description: t("travel.intro.pillars.flight.description"),
		icon: "i-lucide-plane",
		bgColor: "amber",
		iconColor: "amber",
	},
];

const defaultLocationFacts: StatItem[] = [
	{ label: t("travel.locationFacts.walk.label"), value: t("travel.locationFacts.walk.value") },
	{ label: t("travel.locationFacts.port.label"), value: t("travel.locationFacts.port.value") },
	{ label: t("travel.locationFacts.nature.label"), value: t("travel.locationFacts.nature.value") },
];

const defaultAutoSteps: JourneyStep[] = [
	{
		title: "Bern – Lausanne – Geneve",
		detail: "Grenze Bardonnex Richtung Frankreich",
	},
	{
		title: "Annecy – Chambery – Grenoble",
		detail: "A41 / A43 / A48",
	},
	{
		title: "Valence – Orange – Aix",
		detail: "A49 / A7 / A8",
	},
	{
		title: "Toulon – Hyeres – Giens",
		detail: "A52 / A50 / A570",
	},
];

const defaultTrainSteps: JourneyStep[] = [
	{ eyebrow: "Etappe 1", title: "Bern – Geneve", detail: "InterCity, ca. 1h 45min" },
	{ eyebrow: "Etappe 2", title: "Geneve – Marseille", detail: "TGV Lyria, ca. 4h 30min" },
	{ eyebrow: "Etappe 3", title: "Marseille – Hyeres", detail: "TER, ca. 1h" },
];

const defaultFlightFacts: FeatureCard[] = [
	{
		icon: "i-lucide-plane-takeoff",
		title: t("travel.flugzeug.directFlights"),
		description: t("travel.flugzeug.directFlightsText"),
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-car-front",
		title: t("travel.flugzeug.rentalCar"),
		description: t("travel.flugzeug.rentalCarText"),
		bgColor: "amber",
		iconColor: "amber",
	},
];

const publicPageBundle = await usePublicPageBundle("travel");
const lageContent = publicPageBundle.createContentSection("travel-lage", () => defaultLage.value);
const autoContent = publicPageBundle.createContentSection("travel-auto", () => defaultAuto.value);
const zugContent = publicPageBundle.createContentSection("travel-zug", () => defaultZug.value);
const flugzeugContent = publicPageBundle.createContentSection("travel-flugzeug", () => defaultFlugzeug.value);
const routeFacts = publicPageBundle.createDataSection<StatItem[]>("travel-intro-facts", defaultRouteFacts);
const planningPillars = publicPageBundle.createDataSection<FeatureCard[]>("travel-intro-pillars", defaultPlanningPillars);
const locationFacts = publicPageBundle.createDataSection<StatItem[]>("travel-location-facts", defaultLocationFacts);
const autoSteps = publicPageBundle.createDataSection<JourneyStep[]>("travel-auto-steps", defaultAutoSteps);
const trainSteps = publicPageBundle.createDataSection<JourneyStep[]>("travel-zug-steps", defaultTrainSteps);
const flightFacts = publicPageBundle.createDataSection<FeatureCard[]>("travel-flugzeug-facts", defaultFlightFacts);

function getColorClasses(color: string) {
	const colors: Record<string, { bg: string; text: string; border: string }> = {
		blue: {
			bg: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-600 dark:text-blue-400",
			border: "border-blue-100 dark:border-blue-900",
		},
		amber: {
			bg: "bg-amber-100 dark:bg-amber-900/30",
			text: "text-amber-600 dark:text-amber-400",
			border: "border-amber-100 dark:border-amber-900",
		},
		rose: {
			bg: "bg-rose-100 dark:bg-rose-900/30",
			text: "text-rose-600 dark:text-rose-400",
			border: "border-rose-100 dark:border-rose-900",
		},
		emerald: {
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			text: "text-emerald-600 dark:text-emerald-400",
			border: "border-emerald-100 dark:border-emerald-900",
		},
		purple: {
			bg: "bg-purple-100 dark:bg-purple-900/30",
			text: "text-purple-600 dark:text-purple-400",
			border: "border-purple-100 dark:border-purple-900",
		},
		cyan: {
			bg: "bg-cyan-100 dark:bg-cyan-900/30",
			text: "text-cyan-600 dark:text-cyan-400",
			border: "border-cyan-100 dark:border-cyan-900",
		},
	};

	return colors[color] || colors.blue;
}

function stripHtml(html: string) {
	return html
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function excerptFromHtml(html: string, maxLength = 140) {
	const text = stripHtml(html);
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trim() + "...";
}

const routeModeCards = computed(() => [
	{
		id: "mit-dem-auto",
		icon: "i-lucide-car",
		title: t("travel.auto.title"),
		kicker: t("travel.intro.pillars.drive.title"),
		summary: excerptFromHtml(autoContent.content.value || defaultAuto.value),
		meta: routeFacts.data.value[1]?.value || "7-8 h",
		ctaLabel: t("travel.auto.routeButton"),
		ctaHref: mapDirectionsUrl,
	},
	{
		id: "mit-dem-zug",
		icon: "i-lucide-train-front",
		title: t("travel.zug.title"),
		kicker: t("travel.intro.pillars.train.title"),
		summary: excerptFromHtml(zugContent.content.value || defaultZug.value),
		meta: trainSteps.data.value.length ? trainSteps.data.value.map(step => step.title).join(" -> ") : "Bern -> Marseille -> Hyeres",
		ctaLabel: t("travel.quickLinks.zug"),
		ctaHref: "#mit-dem-zug",
	},
	{
		id: "mit-dem-flugzeug",
		icon: "i-lucide-plane",
		title: t("travel.flugzeug.title"),
		kicker: t("travel.intro.pillars.flight.title"),
		summary: excerptFromHtml(flugzeugContent.content.value || defaultFlugzeug.value),
		meta: routeFacts.data.value[2]?.value || "15 min",
		ctaLabel: t("travel.quickLinks.flugzeug"),
		ctaHref: "#mit-dem-flugzeug",
	},
]);

const arrivalNotes = computed(() => [
	{
		icon: "i-lucide-map-pinned",
		title: destinationAddress,
		description: t("travel.intro.body"),
	},
	{
		icon: "i-lucide-car-taxi-front",
		title: t("travel.zug.transfer"),
		description: t("travel.zug.transferText"),
	},
	{
		icon: "i-lucide-info",
		title: t("travel.auto.tip"),
		description: t("travel.auto.tipText"),
	},
]);

useHead({
	title: t("nav.travel"),
});
</script>
