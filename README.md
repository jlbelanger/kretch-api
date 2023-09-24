# Kretch API

Kretch is a multi-player movie/TV/song/people/meme guessing game. [View the site](https://kretch.jennybelanger.com/).

## Development

### Requirements

- [Git](https://git-scm.com/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)

### Setup

``` bash
git clone https://github.com/jlbelanger/kretch-api.git
cd kretch-api
cp .env.example .env
yarn install
yarn global add pm2@4.4.0
pm2-dev start start.js
```

Then, setup the [Kretch app](https://github.com/jlbelanger/kretch-app).

### Lint

``` bash
yarn lint
```

## Deployment

Essentially, to set up the repo on the server:

``` bash
git clone https://github.com/jlbelanger/kretch-api.git
cd kretch-api
cp .env.example .env
# Then configure the values in .env.
yarn install
yarn global add pm2@4.4.0
pm2 start start.js --name kretch-api
```

For subsequent deploys, push changes to the main branch, then run the following on the server:

``` bash
cd kretch-api
git fetch origin
git pull
yarn install
pm2 restart kretch-api
```

### Deploy script

Note: The deploy script included in this repo depends on other scripts that only exist in my private repos. If you want to deploy this repo, you'll have to create your own script.

``` bash
./deploy.sh
```

## Sources

- `actors.json`: https://www.imdb.com/list/ls058011111/
- `characters.json`: https://www.thrillist.com/entertainment/nation/best-tv-characters-of-the-21st-century-ranked, https://www.ranker.com/lists/531165
- `memes.json`: knowyourmeme.com
- `movies.json`, `tv-shows.json`: imdb.com
- `people.json`: https://en.wikipedia.org/wiki/List_of_stars_on_the_Hollywood_Walk_of_Fame
- `songs.json`: billboard.com
