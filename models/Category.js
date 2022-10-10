class Category {
	static fetch() {
		return require('../data/category.json');
	}

	static get(id) {
		const rows = this.fetch();
		if (!id) {
			return { rows };
		}

		const index = rows.findIndex((row) => (row.id === id));
		return index > -1 ? rows[index] : null;
	}

	static find(rows, value, attribute) {
		return rows.findIndex((row) => (row[attribute] === value));
	}
}

module.exports = Category;
