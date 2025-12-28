import data from '../data/method.json' with { type: 'json' };

export default class Method {
	static fetch() {
		return data;
	}

	static get(id) {
		const rows = this.fetch();
		if (!id) {
			return { rows };
		}

		const index = rows.findIndex((row) => (row.id === id));
		return index > -1 ? rows[index] : null;
	}

	static random(rows, playerMethods) {
		const filteredRows = rows.filter((row) => (playerMethods.includes(row.slug)));
		const num = filteredRows.length;
		const index = Math.floor(Math.random() * num);
		return filteredRows[index];
	}
}
