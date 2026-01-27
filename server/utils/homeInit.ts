import { db } from "../useFirebaseAdmin";
import type { Home } from "../../types";

export async function initializeHomes(maxHomeNumber: number = 30): Promise<{ created: number; existing: number }> {
	let created = 0;
	let existing = 0;

	const homesSnapshot = await db.collection("homes").get();
	const existingHomes = new Set(homesSnapshot.docs.map((doc) => doc.data().name));

	for (let i = 1; i <= maxHomeNumber; i++) {
		const homeName = `Haus ${i}`;

		if (existingHomes.has(homeName)) {
			existing++;
			continue;
		}

		const newHome: Partial<Home> = {
			name: homeName,
			enabled: false,
			ownerId: "",
			editors: [],
			photos: [],
			contact: {},
			wifiPassword: "",
			checkInInfo: "",
			checkOutInfo: "",
			mustKnows: [],
			houseRules: "",
			blanketsInfo: "",
			cleaningInfo: [],
			parkingNumber: "",
			washingMachineOverride: "",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("homes").add(newHome);
		created++;
	}

	return { created, existing };
}

export async function getNextHomeNumber(): Promise<number> {
	const maxHomeNumber = await getMaxHomeNumber();

	for (let i = 1; i <= maxHomeNumber; i++) {
		const snapshot = await db.collection("homes").where("name", "==", `Haus ${i}`).limit(1).get();
		if (snapshot.empty) {
			return i;
		}
	}

	return 0;
}

async function getMaxHomeNumber(): Promise<number> {
	const config = useRuntimeConfig();
	const settingsRef = await db.collection("settings").doc("global").get();

	if (settingsRef.exists) {
		const settings = settingsRef.data();
		return settings?.maxHomeNumber || 30;
	}

	return 30;
}