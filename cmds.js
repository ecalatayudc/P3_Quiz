const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require("./model");
const Sequelize = require('sequelize');


exports.helpCmd = rl =>{
     log("Comandos:");
     log("  h|help - Muestra esta ayuda.");
     log("  list - Listar los quizzes existentes.");
     log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
     log("  add - Añadir un nuevo quiz interactivamente.");
     log("  delete <id> - Borrar el quiz indicado.");
     log("  edit <id> - Editar el quiz indicado.");
     log("  test <id> - Probar el quiz indicado.");
     log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
     log("  credits - Créditos.");
     log("  q|quit Salir del programa.");
     rl.prompt();
};
exports.listCmd = rl =>{

	models.quiz.findAll()
	.each(quiz => {
			log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
const validateId = id => {

	return new Sequelize.Promise((resolve,reject) => {
			if(typeof id === "undefined"){
				reject(new Error(`Flata el parametro <id>.`))
			}else {
				id = parseInt(id);
				if(Number.isNaN(id)){
					reject(new Error(`El valor del parámetro <id> no es un número.`));
				}else{
					resolve(id);
				}
			}
	});
};


exports.showCmd = (rl,id) =>{
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
 
const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text,'red'), answer =>{
			resolve(answer.trim());
		});
	});
};

exports.addCmd = rl =>{
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca una respuesta: ')
		.then(a => {
			return {question: q, answer:a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then ((quiz) => {
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
exports.deleteCmd = (rl,id) =>{
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then (() => {
		rl.prompt();
	});
};
exports.editCmd = (rl, id) =>{
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
	    }
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, ' Introduzca una pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, ' Introduzca la respuesta ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize (quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)

	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
exports.testCmd = (rl,id) =>{
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		//process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
		return makeQuestion(rl, quiz.question+'? ')
		.then(a => {
			if(getCleanedString( a.toLowerCase()) === getCleanedString(quiz.answer.toLowerCase().trim())){
				log('Su respuesta es: correcta');
					//biglog('Correcta', 'green');
			}else{
				log('Su respuesta es: incorrecta');
						//biglog('Incorrecta', 'red');
			}	
		});
	})	
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
	
};
exports.playCmd = rl =>{
	let score =0;
	let toBePlayed=[];
	


	const playone = () => {

		return Promise.resolve()
		.then (() => {

			if(toBePlayed.length<=0){
				console.log("Fin");
				//resolve();
				return;
			}

			let pos =Math.floor(Math.random()*toBePlayed.length)
			let quiz = toBePlayed[pos];
			toBePlayed.splice(pos,1);

			return makeQuestion(rl, quiz.question +'? ')
			.then(anser => {

				if(anser.toLowerCase().trim()==quiz.answer.toLowerCase().trim()){
					score++;
					console.log("correcta ");
					return playone();

				}else{
					console.log("incorrecta");
					//resolve();
				}
			})
		})
		//return new Sequelize.Promise((resolve,reject)=>{

		//})
	}

	models.quiz.findAll({raw: true})//raw devuelve un array mas pequeño que sin el 
	.then(quizzes => {
		toBePlayed=quizzes;

	})
	.then(()=>{
		return playone();// con el return el catch se espera hasta que la promesa playone haya acabado(devuelve una promesa)
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		console.log('Fin'+score);
		rl.prompt();
	});





	/*let score = 0;
	let toBeResolved = [];
    let i=0;
    return models.quiz.findAll()
	.then(quizzes => {
		quizzes.forEach((quiz) =>{
			toBeResolved[i]=quiz.id;
			i++;
		})
			return toBeResolved;
	})
	.then(toBeResolved => {
	const playone= () =>{
			if(toBeResolved.length === 0){
				log(` ¡QUIZ COMPLETADO!`);
				log(` Tu número de aciertos ha sido: ${score}`);
				//biglog(score, 'blue');
				rl.prompt();
			}else{
				let nTBR=Math.floor(Math.random()*(toBeResolved.length));
				let id= toBeResolved[nTBR];
				toBeResolved.splice(nTBR,1);
				validateId(id)
				.then(id => models.quiz.findById(id))
				//let quiz = model.getByIndex(id);
				.then(quiz => {
					if (!quiz){
						throw new Error(`No existe un quiz asociado al id=${id}.`);
					}
					//process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
					return makeQuestion(rl, quiz.question+'? ')
					.then(a => {
						if(getCleanedString( a.toLowerCase()) === getCleanedString(quiz.answer.toLowerCase().trim())){
							score++;
							log(`respuesta correct - lleva ${score} aciertos`);
							playone();
								//biglog('Correcta', 'green');
						}else{
							log(`Respuesta incorrect, fin del quiz `);
							log(`número total de aciertos: ${score}`);
							//biglog(score, 'blue');
							rl.prompt();
						}	
					});
				})
			}
    	}	
    playone();
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});*/
};

exports.creditsCmd = rl =>{
	 log('Autores de la práctica:');
     log('Enrique Calatayud Candelas','green');
     rl.prompt();
};

exports.quitCmd = rl =>{
	 rl.close(); 
};
getCleanedString = (cadena)=>{
   // Definimos los caracteres que queremos eliminar
   var specialChars = "!@#$^&%*()+=-[]\/{}|:<>?,.";

   // Los eliminamos todos
   for (var i = 0; i < specialChars.length; i++) {
       cadena= cadena.replace(new RegExp("\\" + specialChars[i], 'gi'), '');
   }   

   // Quitamos acentos y "ñ". Fijate en que va sin comillas el primer parametro
   cadena = cadena.replace(/á/gi,"a");
   cadena = cadena.replace(/é/gi,"e");
   cadena = cadena.replace(/í/gi,"i");
   cadena = cadena.replace(/ó/gi,"o");
   cadena = cadena.replace(/ú/gi,"u");
   cadena = cadena.replace(/ñ/gi,"n");
   return cadena;
}