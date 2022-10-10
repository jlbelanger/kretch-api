const uuid = require('uuid');

class Clue {
	static fetch() {
		const output = [];
		const numCluesInCategory = {};
		const data = [
			{ categorySlug: 'person', clues: require('../data/clues/actors.json') },
			{ categorySlug: 'person', clues: require('../data/clues/characters.json') },
			{ categorySlug: 'person', clues: require('../data/clues/people.json') },
			{ categorySlug: 'meme', clues: require('../data/clues/memes.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1920s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1930s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1940s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1950s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1960s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1970s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1980s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-1990s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-2000s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-2010s.json') },
			{ categorySlug: 'movie', clues: require('../data/clues/movies-2020s.json') },
			{ categorySlug: 'song', clues: require('../data/clues/songs.json') },
			{ categorySlug: 'song', clues: require('../data/clues/songs-2017.json') },
			{ categorySlug: 'song', clues: require('../data/clues/songs-2018.json') },
			{ categorySlug: 'song', clues: require('../data/clues/songs-2019.json') },
			{ categorySlug: 'song', clues: require('../data/clues/songs-2020.json') },
			{ categorySlug: 'song', clues: require('../data/clues/songs-2021.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-1940s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-1950s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-1960s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-1970s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-1980s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-1990s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-2000s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-2010s.json') },
			{ categorySlug: 'tv-show', clues: require('../data/clues/tv-shows-2020s.json') },
		];

		data.forEach((group) => {
			// Keep track of the number of clues in each category so we know when a category is empty.
			if (!Object.prototype.hasOwnProperty.call(numCluesInCategory, group.categorySlug)) {
				numCluesInCategory[group.categorySlug] = 0;
			}

			group.clues.forEach((clue) => {
				if (!Object.prototype.hasOwnProperty.call(clue, 'foreign')) {
					output.push({
						...clue,
						id: uuid.v4(),
						categorySlug: group.categorySlug,
					});
					numCluesInCategory[group.categorySlug] += 1;
				}
			});
		});

		return {
			rows: output,
			numCluesInCategory,
		};
	}

	static get(id) {
		const data = this.fetch();
		if (!id) {
			return data;
		}

		const index = data.rows.findIndex((row) => (row.id === id));
		return index > -1 ? data.rows[index] : null;
	}

	static random(clues, categorySlug, usedClueIds, playerSettings) {
		const pool = [];
		let i;
		const numGroups = clues.length;
		let clue;
		let clueYear;
		for (i = 0; i < numGroups; i += 1) {
			clue = clues[i];
			if (categorySlug && clue.categorySlug !== categorySlug) {
				continue;
			}
			if (!categorySlug && !playerSettings.categories.includes(clue.categorySlug)) {
				continue;
			}
			if (Object.prototype.hasOwnProperty.call(clue, 'year')) {
				clueYear = clue.year.toString().substring(0, 4);
				if (clueYear < playerSettings.minYear[clue.categorySlug].toString()) {
					continue;
				}
				if (clueYear > playerSettings.maxYear[clue.categorySlug].toString()) {
					continue;
				}
			}
			if (usedClueIds.indexOf(clue.id) > -1) {
				continue;
			}
			pool.push(clue);
		}

		const numClues = pool.length;
		if (numClues <= 0) {
			return null;
		}

		const index = Math.floor(Math.random() * numClues);
		return pool[index];
	}
}

module.exports = Clue;
