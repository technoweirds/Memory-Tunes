let blockData = [
	{ selector: '.block1', name: '1', pitch: '1' },
	{ selector: '.block2', name: '2', pitch: '2' },
	{ selector: '.block3', name: '3', pitch: '3' },
	{ selector: '.block4', name: '4', pitch: '4' }
];

let soundData = [
	{ name: 'correct', sets: [ 1, 3, 5, 8 ] },
	{ name: 'wrong', sets: [ 2, 4, 5.5, 7 ] }
];

class Blocks {
	constructor(blockAssign, soundAssign) {
		// In map(), use () to inclute {} and return an object. If not, browser will see {} as a function
		this.blocks = blockAssign.map((data, index) => ({
			name: data.name,
			el: document.querySelector(data.selector),
			audio: this.getAudioObject(data.pitch)
		}));

		this.soundSets = soundAssign.map((data, index) => ({
			name: data.name,
			sets: data.sets.map((pitch) => this.getAudioObject(pitch))
		}));
	}

	getAudioObject(pitch) {
		// return new Audio(`/audio/piano_sound_${pitch}.wav`);
		return new Audio(`https://awiclass.monoame.com/pianosound/set/${pitch}.wav`);
	}

	flashAndPlayAudio(note) {
		const block = this.blocks.find((data) => data.name === note);

		if (block) {
			block.el.classList.add('light');
			block.audio.currentTime = 0; // Reset the playing time, let audios be played in any time
			block.audio.play();

			setTimeout(() => {
				if (!this.allOn) block.el.classList.remove('light'); // "allOn" is a key to control the light off timing. In general, one of the lights will be turned off 0.1s after clicking, but when functions flashAndPlayAudio() and turnAllOn() being executed at the same time(when a player clicks wrong), this setTimeout() will be ignored and all lights will be turned off after 0.4s.
			}, 100);
		}
	}

	turnAllOn() {
		this.allOn = true;

		this.blocks.forEach((block) => {
			block.el.classList.add('light');
		});
	}

	turnAllOff() {
		this.allOn = false;

		this.blocks.forEach((block) => {
			block.el.classList.remove('light');
		});
	}

	playSet(type) {
		const sets = this.soundSets.find((obj) => obj.name === type).sets;
		// console.log(sets);

		sets.forEach((obj) => {
			obj.currentTime = 0;
			obj.play();
		});
	}
}

class MemoryGame {
	constructor() {
		this.blocks = new Blocks(blockData, soundData);
		this.wrapElement = document.querySelector('.wrap');
		this.statusElement = document.querySelector('.status');
		this.blockElements = document.querySelectorAll('.block');
		this.inputProgressElement = document.querySelector('.inputProgress');
		this.circleElements = document.querySelectorAll('.circle');
		this.endWindowElement = document.querySelector('.endWindow');
		this.memoryLevelElement = document.querySelector('.memoryLevel');
		this.restartElement = document.querySelector('.restart');
		this.levelString = '1234';
		this.currentLevel = 0;
		this.replayTimes;
		this.playInterval = 400;
		this.mode = 'Waiting'; // Progress in any level: 'Listening' => 'Inputting' => 'Waiting'
		this.userInput = '';
		this.events();
	}

	events() {
		setTimeout(() => {
			this.startNewLevel();
		}, 1000);

		// this.blocks.blocks.forEach((el) => {
		// 	el.el.addEventListener('click', (e) => {
		// 		// console.log(e.target.id);
		// 		this.checkInputs(e.target.id);
		// 	});
		// });
		this.blockElements.forEach((el) => {
			el.addEventListener('click', (e) => {
				// console.log(e.target.id);
				this.checkInputs(e.target.id);
			});
		});

		this.restartElement.addEventListener('click', () => {
			this.wrapElement.classList.remove('blur');
			this.endWindowElement.classList.add('hide');
			this.startNewLevel();
		});
	}

	startNewLevel() {
		this.replayTimes = 1;

		// At level 0(warming up level), the answer is always '1234'
		if (this.currentLevel === 0) {
			this.levelString = '1234';
			this.statusElement.textContent = 'Click in the flashing order';
		} else {
			// Add two random numbers at a higher level
			for (let i = 0; i < 2; i++) {
				this.levelString += this.createRandomNumber(1, 4);
			}
			this.statusElement.textContent = `Memory Level: ${this.currentLevel}`;
		}

		console.clear();
		console.log(`currentLevel: ${this.currentLevel}`);
		console.log(`levelString: '${this.levelString}'`);
		this.startListening();
	}

	// Returns a random integer from a to b
	createRandomNumber(a, b) {
		return Math.floor(Math.random() * b) + a;
	}

	startListening() {
		this.mode = 'Listening';

		this.blockElements.forEach((el) => {
			el.classList.add('stopInputting');
		});

		this.showinputProgressCircles(''); // Not yet 'inputting', so put an empty string as a parameter

		const notesArray = this.levelString.split('');

		// Continuously take out one element from notesArray to play the corresponding sound
		this.timer = setInterval(() => {
			const note = notesArray.shift();
			
			// When audios playing done, player start to input
			if (!notesArray.length) {
				clearInterval(this.timer);
				// console.log('Audios play end');

				setTimeout(() => {
					this.startInputting();
				}, this.playInterval);
			}

			// console.log(note);
			this.blocks.flashAndPlayAudio(note);

		}, this.playInterval);
	}

	startInputting() {
		this.mode = 'Inputting';

		this.blockElements.forEach((el) => {
			el.classList.remove('stopInputting');
		});

		this.userInput = '';
	}

	// Checking the player's input is correct or not. If correct, the level goes to the next one; if wrong, restart the game.
	checkInputs(inputChar) {
		if (this.mode === 'Inputting') {
			const tempString = this.userInput + inputChar;

			this.userInput += inputChar;
			this.showinputProgressCircles(tempString);
			this.blocks.flashAndPlayAudio(inputChar);

			// Checking input one on one
			if (this.levelString.indexOf(tempString) === 0) {
				// console.log('So far good.');

				// If the player's input is completely same to this.levelString
				if (tempString === this.levelString) {
					this.gameContinue();
				}
			} else {
				this.replayTimes > 0 ? this.replayCurrentLevel() : this.gameOver();
			}
		}
	}

	// When this.mode is 'inputting', show circle status below the blocks
	showinputProgressCircles(tempString) {
		this.inputProgressElement.innerHTML = '';

		// Updata circle div elements in any level
		this.levelString.split('').forEach((data, index) => {
			this.inputProgressElement.innerHTML += `
				<div class="circle${index < tempString.length ? ' correct' : ''}"></div>`;
		});

		this.inputProgressElement.classList.remove('correct', 'wrong');

		// If all inputs are correct, make circles blue
		if (tempString === this.levelString) {
			setTimeout(() => {
				this.inputProgressElement.classList.add('correct');
			}, this.playInterval);
		}
		// If not, make circles red immediately
		if (this.levelString.indexOf(tempString) !== 0) {
			this.inputProgressElement.classList.add('wrong');
		}
	}

	gameContinue() {
		// console.log('Correct!');
		this.replayTimes = 1;
		this.currentLevel += 1;
		this.mode = 'Waiting'; // Do not accept the player's input(click)

		setTimeout(() => {
			this.blocks.turnAllOn();
			this.blocks.playSet('correct');
			this.statusElement.textContent = 'Correct!';
		}, this.playInterval);

		setTimeout(() => {
			this.blocks.turnAllOff();
		}, this.playInterval * 2);

		setTimeout(() => {
			this.startNewLevel();
		}, this.playInterval + 600);
	}

	replayCurrentLevel() {
		this.replayTimes -= 1;
		this.mode = 'Waiting';
		this.blocks.turnAllOn();
		this.blocks.playSet('wrong');

		setTimeout(() => {
			this.blocks.turnAllOff();
		}, this.playInterval);

		setTimeout(() => {
			if (this.currentLevel === 0) {
				this.statusElement.textContent = 'Click in the flashing order';
			} else {
				this.statusElement.textContent = `Memory Level: ${this.currentLevel}`;
			}

			this.startListening();
		}, this.playInterval + 600);
	}

	gameOver() {
		// console.log('Wrong.');
		this.mode = 'Waiting';
		this.blocks.turnAllOn();
		this.blocks.playSet('wrong');

		setTimeout(() => {
			this.inputProgressElement.innerHTML = '';
			this.blocks.turnAllOff();
			this.wrapElement.classList.add('blur');
			this.endWindowElement.classList.remove('hide');

			if (this.currentLevel <= 1) {
				this.memoryLevelElement.textContent = `Oops! You didn't accomplish any level.`;
			} else {
				this.memoryLevelElement.textContent = `Your Memory Level: ${this.currentLevel - 1}`;
			}

			this.currentLevel = 0;
		}, this.playInterval);
	}
}

window.onload = () => {
	let memoryGame = new MemoryGame();
}