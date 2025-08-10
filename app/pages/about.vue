<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

const items = ref<TimelineItem[]>([
	{
		date: "März 1992",
		title: "Kauf des Grundstücks in Giens",
		description: "Die SBB Pensionskasse beschliesst den Kauf des Lotissement Beausoleil und bietet ihren Mitarbeitenden vergünstigte Konditionen zum Kauf eines Ferienhauses.",
		icon: "i-lucide-circle-dollar-sign",
	},
	{
		date: "April 1993",
		title: "Spatenstich",
		description: "Die Bauarbeiten beginnen unter Aufsicht des lokalen Bauunternehmens Implenia France.",
		icon: "i-lucide-pickaxe",
	},
	{
		date: "Januar 1995",
		title: "Kauf der ersten Wohnung",
		description: "Die Familie Zgraggen schliesst den Kauf des Hauses Nr. 11 ab und zieht ein.",
		icon: "i-lucide-house",
	},
	{
		date: "September 1997",
		title: "Das letzte Haus wird an die Familie Müller verkauft",
		description: "Nun ist das Lotissement Beausoleil vollständig vermietet. Die Siedlung wimmelt von jungen Familien und Giens wird zur beliebtesten Feriendestination Frankreichs.",
		icon: "i-lucide-party-popper",
	},
	{
		date: "Oktober 2009",
		title: "Renovation des Lotissements",
		description: "Nach über 15 Jahren wird das Lotissement grundsaniert und erhält einen Pool wo die Kinder spielen können.",
		icon: "i-lucide-construction",
	},
	{
		date: "Oktober 2019",
		title: "Die Pensionskasse SBB zieht sich zurück",
		description: "Das Lotissement wird neu durch die Bewohner verwaltet. Ein Verwaltungsrat wird gegründet, dieser trifft sich zweimal jährlich – in Giens, natürlich...",
		icon: "i-lucide-users",
	},

]);
</script>

<template>
	<div class="max-w-screen-xl mx-auto">
		<UTimeline :default-value="4" :items="items" class="w-xl my-12 mx-auto" />
	</div>
</template>
