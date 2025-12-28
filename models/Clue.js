import actors from '../data/clues/actors.json' with { type: 'json' };
import characters from '../data/clues/characters.json' with { type: 'json' };
import memes from '../data/clues/memes.json' with { type: 'json' };
import movies1920s from '../data/clues/movies-1920s.json' with { type: 'json' };
import movies1930s from '../data/clues/movies-1930s.json' with { type: 'json' };
import movies1940s from '../data/clues/movies-1940s.json' with { type: 'json' };
import movies1950s from '../data/clues/movies-1950s.json' with { type: 'json' };
import movies1960s from '../data/clues/movies-1960s.json' with { type: 'json' };
import movies1970s from '../data/clues/movies-1970s.json' with { type: 'json' };
import movies1980s from '../data/clues/movies-1980s.json' with { type: 'json' };
import movies1990s from '../data/clues/movies-1990s.json' with { type: 'json' };
import movies2000s from '../data/clues/movies-2000s.json' with { type: 'json' };
import movies2010s from '../data/clues/movies-2010s.json' with { type: 'json' };
import movies2020s from '../data/clues/movies-2020s.json' with { type: 'json' };
import people from '../data/clues/people.json' with { type: 'json' };
import songs from '../data/clues/songs.json' with { type: 'json' };
import songs2017 from '../data/clues/songs-2017.json' with { type: 'json' };
import songs2018 from '../data/clues/songs-2018.json' with { type: 'json' };
import songs2019 from '../data/clues/songs-2019.json' with { type: 'json' };
import songs2020 from '../data/clues/songs-2020.json' with { type: 'json' };
import songs2021 from '../data/clues/songs-2021.json' with { type: 'json' };
import tvShows1940s from '../data/clues/tv-shows-1940s.json' with { type: 'json' };
import tvShows1950s from '../data/clues/tv-shows-1950s.json' with { type: 'json' };
import tvShows1960s from '../data/clues/tv-shows-1960s.json' with { type: 'json' };
import tvShows1970s from '../data/clues/tv-shows-1970s.json' with { type: 'json' };
import tvShows1980s from '../data/clues/tv-shows-1980s.json' with { type: 'json' };
import tvShows1990s from '../data/clues/tv-shows-1990s.json' with { type: 'json' };
import tvShows2000s from '../data/clues/tv-shows-2000s.json' with { type: 'json' };
import tvShows2010s from '../data/clues/tv-shows-2010s.json' with { type: 'json' };
import tvShows2020s from '../data/clues/tv-shows-2020s.json' with { type: 'json' };
import { v4 as uuidv4 } from 'uuid'; // eslint-disable-line import/no-unresolved

export default class Clue {
	static fetch() {
		const output = [];
		const numCluesInCategory = {};
		const data = [
			{ categorySlug: 'person', clues: actors },
			{ categorySlug: 'person', clues: characters },
			{ categorySlug: 'person', clues: people },
			{ categorySlug: 'meme', clues: memes },
			{ categorySlug: 'movie', clues: movies1920s },
			{ categorySlug: 'movie', clues: movies1930s },
			{ categorySlug: 'movie', clues: movies1940s },
			{ categorySlug: 'movie', clues: movies1950s },
			{ categorySlug: 'movie', clues: movies1960s },
			{ categorySlug: 'movie', clues: movies1970s },
			{ categorySlug: 'movie', clues: movies1980s },
			{ categorySlug: 'movie', clues: movies1990s },
			{ categorySlug: 'movie', clues: movies2000s },
			{ categorySlug: 'movie', clues: movies2010s },
			{ categorySlug: 'movie', clues: movies2020s },
			{ categorySlug: 'song', clues: songs },
			{ categorySlug: 'song', clues: songs2017 },
			{ categorySlug: 'song', clues: songs2018 },
			{ categorySlug: 'song', clues: songs2019 },
			{ categorySlug: 'song', clues: songs2020 },
			{ categorySlug: 'song', clues: songs2021 },
			{ categorySlug: 'tv-show', clues: tvShows1940s },
			{ categorySlug: 'tv-show', clues: tvShows1950s },
			{ categorySlug: 'tv-show', clues: tvShows1960s },
			{ categorySlug: 'tv-show', clues: tvShows1970s },
			{ categorySlug: 'tv-show', clues: tvShows1980s },
			{ categorySlug: 'tv-show', clues: tvShows1990s },
			{ categorySlug: 'tv-show', clues: tvShows2000s },
			{ categorySlug: 'tv-show', clues: tvShows2010s },
			{ categorySlug: 'tv-show', clues: tvShows2020s },
		];

		data.forEach((group) => {
			// Keep track of the number of clues in each category so we know when a category is empty.
			if (!Object.hasOwn(numCluesInCategory, group.categorySlug)) {
				numCluesInCategory[group.categorySlug] = 0;
			}

			group.clues.forEach((clue) => {
				if (!Object.hasOwn(clue, 'foreign')) {
					output.push({
						...clue,
						id: uuidv4(),
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
			if (Object.hasOwn(clue, 'year')) {
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
