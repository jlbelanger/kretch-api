import { v4 as uuidv4 } from 'uuid'; // eslint-disable-line import/no-unresolved

export default class Player {
	static create(name, categories, methods) {
		const maxYear = {};
		const minYear = {};

		categories.forEach((category) => {
			maxYear[category.slug] = category.maxYear;
			minYear[category.slug] = category.minYear;
		});

		return {
			id: uuidv4(),
			name,
			settings: {
				categories: categories.map((category) => category.slug),
				methods: methods.map((method) => method.slug),
				maxYear,
				minYear,
			},
		};
	}

	static find(rows, value, attribute) {
		return rows.findIndex((row) => row[attribute] === value);
	}
}
