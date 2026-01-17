import { v4 as uuidv4 } from 'uuid'; // eslint-disable-line import/no-unresolved

export default class Room {
	static create(rooms, categories) {
		const categoryCount = {};
		let i;
		const num = categories.length;
		for (i = 0; i < num; i += 1) {
			categoryCount[categories[i].slug] = 0;
		}

		return {
			id: uuidv4(),
			code: this.generateCode(rooms),
			players: [],
			usedClueIds: [],
			categoryCount,
			deadline: null,
			step: null,
			currentPlayerIndex: 0,
			currentCategory: null,
			currentClue: null,
			currentMethod: null,
			settings: {
				maxMinutes: null,
				maxSkips: null,
			},
			wasCorrect: false,
		};
	}

	static find(rows, value, attribute) {
		return rows.findIndex((row) => row[attribute] === value);
	}

	static generateCode(rows) {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
		const numChars = chars.length;
		const len = 4;
		let i;
		let code;
		const maxRooms = numChars * len;

		if (rows.length >= maxRooms) {
			return null;
		}

		do {
			code = '';
			for (i = 0; i < len; i += 1) {
				code += chars[Math.floor(Math.random() * numChars)];
			}
		} while (this.find(rows, code, 'code') > -1);

		return code;
	}
}
