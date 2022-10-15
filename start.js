const dotenv = require('dotenv');
const express = require('express');
const socketIo = require('socket.io');
const Category = require('./models/Category');
const Clue = require('./models/Clue');
const Method = require('./models/Method');
const Player = require('./models/Player');
const Room = require('./models/Room');

dotenv.config();

const clueData = Clue.get();
const categoryData = Category.get();
const methodData = Method.get();
categoryData.rows.forEach((row) => {
	row.count = clueData.numCluesInCategory[row.slug];
});

const myData = {
	categories: categoryData.rows,
	clues: clueData.rows,
	methods: methodData.rows,
	rooms: [],
	sockets: {},
};

const app = express();

app.get('/', (_req, res) => {
	res.send('<code>The streetcar is going up the hill.</code>');
});

app.use(express.static(`${__dirname}/public`));

const server = app.listen(process.env.KRETCH_API_PORT);
server.on('listening', () => {
	console.log(`Listening on ${process.env.KRETCH_API_PORT}`); // eslint-disable-line no-console
});

const io = socketIo(server, {
	cors: {
		origin: process.env.KRETCH_APP_URL,
		methods: ['GET', 'POST'],
	},
});

io.on('connection', (socket) => {
	socket.on('disconnect', () => {
		if (Object.prototype.hasOwnProperty.call(myData.sockets, socket.id)) {
			removePlayerFromRoom(socket, myData.sockets[socket.id].roomId, myData.sockets[socket.id].playerId);
		}
	});

	socket.on('CREATE_ROOM', (input) => {
		// Create the room.
		const room = Room.create(myData.rooms, myData.categories);
		if (!room.code) {
			socket.emit('ERROR_NO_ROOM');
			return;
		}
		myData.rooms.push(room);

		// Create the player.
		const player = Player.create(input.name, myData.categories, myData.methods);

		// Add the player to the room.
		addPlayerToRoom(socket, room, player);
	});

	socket.on('JOIN_ROOM', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.code.toUpperCase(), 'code');
		if (roomIndex < 0) {
			socket.emit('ERROR_INVALID_ROOM');
			return;
		}

		// Create the player.
		const player = Player.create(input.name, myData.categories, myData.methods);

		// Add the player to the room.
		const room = myData.rooms[roomIndex];
		addPlayerToRoom(socket, room, player, roomIndex);

		// Notify the rest of the channel the player has joined.
		socket.to(myData.rooms[roomIndex].id).emit('ADDED_PLAYER', {
			playerName: player.name,
			room,
		});
	});

	socket.on('LEAVE_ROOM', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			return;
		}

		// Unsubscribe the player from the channel.
		socket.leave(input.roomId);

		// Remove the player from the room.
		removePlayerFromRoom(socket, input.roomId, input.playerId, roomIndex);
	});

	socket.on('START_GAME', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Go the next step.
		myData.rooms[roomIndex].step = 1;
		myData.rooms[roomIndex].settings.maxMinutes = parseFloat(input.maxMinutes);
		myData.rooms[roomIndex].settings.maxSkips = parseInt(input.maxSkips, 10);

		// Notify the players the game has started.
		io.to(input.roomId).emit('STARTED_GAME', {
			room: {
				step: myData.rooms[roomIndex].step,
				settings: myData.rooms[roomIndex].settings,
			},
		});
	});

	socket.on('SAVE_SETTINGS', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Find the player.
		const room = myData.rooms[roomIndex];
		const playerIndex = Player.find(room.players, input.playerId, 'id');
		if (playerIndex < 0) {
			socket.emit('ERROR_DELETED_PLAYER');
			return;
		}

		// Save the player's settings.
		myData.rooms[roomIndex].players[playerIndex].settings = input.settings;

		// Echo the settings back to the player.
		socket.emit('SAVED_SETTINGS', {
			settings: input.settings,
		});
	});

	socket.on('PICK_CATEGORY', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Go the next step.
		myData.rooms[roomIndex].step = 2;

		// Notify the players to go to the next step.
		io.to(input.roomId).emit('PICKED_CATEGORY', {
			room: {
				step: myData.rooms[roomIndex].step,
			},
			categorySlug: input.categorySlug,
		});
	});

	socket.on('RETRIEVE_CLUE', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Generate a random clue for the current player.
		const room = myData.rooms[roomIndex];
		const player = room.players[room.currentPlayerIndex];
		const currentClue = Clue.random(
			myData.clues,
			input.categorySlug,
			room.usedClueIds,
			player.settings
		);
		if (!currentClue) {
			io.to(room.id).emit('ERROR_NO_CLUES');
			return;
		}

		// Get the category data.
		const categoryIndex = Category.find(myData.categories, currentClue.categorySlug, 'slug');
		const currentCategory = categoryIndex > -1 ? myData.categories[categoryIndex] : null;

		// Generate a random method for the current player.
		const currentMethod = Method.random(myData.methods, player.settings.methods);

		// Save the data to the room.
		myData.rooms[roomIndex].currentClue = currentClue;
		myData.rooms[roomIndex].currentCategory = currentCategory;
		myData.rooms[roomIndex].currentMethod = currentMethod;

		// Pass the data to the current player.
		socket.emit('RETRIEVED_CLUE', {
			room: {
				currentClue,
				currentCategory,
				currentMethod,
			},
		});
	});

	socket.on('PICK_CLUE', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Go the next step.
		myData.rooms[roomIndex].step = 3;

		// Set the timer deadline.
		myData.rooms[roomIndex].deadline = new Date().getTime() + (myData.rooms[roomIndex].settings.maxMinutes * 60000);

		// Add the clue to the pool of used clues for the room.
		const clue = myData.rooms[roomIndex].currentClue;
		myData.rooms[roomIndex].usedClueIds.push(clue.id);

		// Increment the number of used clues in this category.
		if (!Object.prototype.hasOwnProperty.call(myData.rooms[roomIndex].categoryCount, clue.categorySlug)) {
			myData.rooms[roomIndex].categoryCount[clue.categorySlug] = 0;
		}
		myData.rooms[roomIndex].categoryCount[clue.categorySlug] += 1;

		// Pass the data to all players.
		io.to(input.roomId).emit('PICKED_CLUE', {
			room: {
				step: myData.rooms[roomIndex].step,
				deadline: myData.rooms[roomIndex].deadline,
				usedClueIds: myData.rooms[roomIndex].usedClueIds,
				categoryCount: myData.rooms[roomIndex].categoryCount,
				currentClue: myData.rooms[roomIndex].currentClue,
				currentCategory: myData.rooms[roomIndex].currentCategory,
				currentMethod: myData.rooms[roomIndex].currentMethod,
			},
		});
	});

	socket.on('COMPLETE_CLUE', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Go the next step.
		myData.rooms[roomIndex].step = 4;
		myData.rooms[roomIndex].wasCorrect = input.wasCorrect;

		// Notify the players to go to the next step.
		io.to(input.roomId).emit('COMPLETED_CLUE', {
			room: {
				step: myData.rooms[roomIndex].step,
				wasCorrect: myData.rooms[roomIndex].wasCorrect,
			},
		});
	});

	socket.on('CHANGE_PLAYER', (input) => {
		// Find the room.
		const roomIndex = Room.find(myData.rooms, input.roomId, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}

		// Go to the next round.
		myData.rooms[roomIndex].step = 1;
		myData.rooms[roomIndex].currentClue = null;

		// Set the next player.
		let playerIndex = myData.rooms[roomIndex].currentPlayerIndex + 1;
		if (playerIndex >= myData.rooms[roomIndex].players.length) {
			playerIndex = 0;
		}
		myData.rooms[roomIndex].currentPlayerIndex = playerIndex;

		// Notify the players to go to the next round.
		io.to(input.roomId).emit('CHANGED_PLAYER', {
			room: {
				step: myData.rooms[roomIndex].step,
				currentClue: myData.rooms[roomIndex].currentClue,
				currentPlayerIndex: myData.rooms[roomIndex].currentPlayerIndex,
			},
		});
	});
});

function addPlayerToRoom(socket, room, player, roomIndex = null) {
	// Find the room.
	if (roomIndex === null) {
		roomIndex = Room.find(myData.rooms, room.id, 'id');
		if (roomIndex < 0) {
			socket.emit('ERROR_DELETED_ROOM');
			return;
		}
	}

	// Add the player to the room.
	myData.rooms[roomIndex].players.push(player);

	// Send the player the game/room data.
	socket.emit('JOINED_ROOM', {
		categories: myData.categories,
		methods: myData.methods,
		room,
		player,
	});

	// Subscribe the player to the room channel.
	socket.join(room.id);

	// Save socket data.
	myData.sockets[socket.id] = {
		roomId: room.id,
		playerId: player.id,
	};
}

function removePlayerFromRoom(socket, roomId, playerId, roomIndex = null) {
	// Find the room.
	if (roomIndex === null) {
		roomIndex = Room.find(myData.rooms, roomId, 'id');
		if (roomIndex < 0) {
			return;
		}
	}

	// Find the player.
	const playerIndex = Player.find(myData.rooms[roomIndex].players, playerId, 'id');
	if (playerIndex < 0) {
		socket.emit('ERROR_DELETED_PLAYER');
		return;
	}

	// Remove the player from the room.
	const playerName = myData.rooms[roomIndex].players[playerIndex].name;
	const numPlayers = myData.rooms[roomIndex].players.length;
	myData.rooms[roomIndex].players.splice(playerIndex, 1);
	const currentPlayerIndex = myData.rooms[roomIndex].currentPlayerIndex;
	if (currentPlayerIndex < playerIndex) {
		// 0 1 [2] 3 and 3 leaves: do nothing.
	} else if (currentPlayerIndex === playerIndex) {
		if (playerIndex === (numPlayers - 1)) {
			// 0 1 [2] and 2 leaves: go to the first player.
			myData.rooms[roomIndex].currentPlayerIndex = 0;
		} else {
			// 0 1 [2] 3 and 2 leaves: do nothing.
		}
		if (myData.rooms[roomIndex].step) {
			myData.rooms[roomIndex].step = 1;
		}
	} else if (currentPlayerIndex > playerIndex) {
		// 0 1 [2] 3 and 1 leaves: reset the player index.
		myData.rooms[roomIndex].currentPlayerIndex -= 1;
	}

	// Delete socket data.
	delete myData.sockets[socket.id];

	// If all players have left, delete the room.
	if (myData.rooms[roomIndex].players.length <= 0) {
		myData.rooms.splice(roomIndex, 1);
		return;
	}

	// Notify the channel the player has left.
	io.to(roomId).emit('REMOVED_PLAYER', {
		playerName,
		room: myData.rooms[roomIndex],
	});
}
