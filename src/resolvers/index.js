const path = require('path')
const fsPromises = require('fs/promises')
const { fileExists, readJsonFile } = require('../utils/fileHandling')
const { GraphQLError, graphql } = require('graphql')
const crypto = require("crypto")

exports.resolvers = {
	Query: {
		getTodoById: async (_, args) => {
			const todoId = args.todoId
			const todoFilePath = path.join(__dirname, `../data/mytodos/${todoId}.json`)

			const todoExist = await fileExists(todoFilePath)
			if (!todoExist) return new GraphQLError('this todo does not exist')
			const todoData = await fsPromises.readFile(todoFilePath, { encoding: 'utf-8' })
			const data = JSON.parse(todoData)
			return data
		},
		getAllTodos: async (_, args) => {
			const todosDirectory = path.join(__dirname, '../data/mytodos')
			const todos = await fsPromises.readdir(todosDirectory)
			const myPromises = []

			todos.forEach((myFile) => {
				const myFilePath = path.join(todosDirectory, myFile)
				myPromises.push(readJsonFile(myFilePath))
			})

			const todoData = await Promise.all(myPromises)
			return todoData
		},

		getProjectById: async (_, args) => {
			const projectId = args.projectId
			// `../data/projects/${projectId}.json`
			const projectFilePath = path.join(__dirname, `../data/projects/${projectId}.json`)

			const projectExists = await fileExists(projectFilePath)
			if (!projectExists) return new GraphQLError('That project does not exist')

			const projectData = await fsPromises.readFile(projectFilePath, { encoding: 'utf-8' })
			const data = JSON.parse(projectData)
			return data
		},

		getAllProjects: async (_, args) => {
			const projectsDirectory = path.join(__dirname, '../data/projects')

			const projects = await fsPromises.readdir(projectsDirectory)

			// const projectData = []

			/* for (const file of projects) {
				// console.log(file)
				const filePath = path.join(projectsDirectory, file)
				const fileContents = await fsPromises.readFile(filePath, { encoding: 'utf-8' })
				const data = JSON.parse(fileContents)
				projectData.push(data)
			} */

			const promises = []
			projects.forEach((fileName) => {
				const filePath = path.join(projectsDirectory, fileName)
				promises.push(readJsonFile(filePath))
			})

			const projectData = await Promise.all(promises)
			return projectData
		},
	},
	Mutation: {
		createProject: async (_, args) => {
			// 1 verify name
			if (args.name.length === 0) return new GraphQLError('Name must be at least one character long')
			// 2 skapa ett id
			const newProject = {
				id: crypto.randomUUID(),
				name: args.name,
				description: args.description || '',
			}

			console.log(newProject)

			// 3 skapa en fil för projekt i /data/projects
			let filePath = path.join(__dirname, '..', 'data', 'projects', `${newProject.id}.json`)

			let idExists = true
			while (idExists) {
				const exists = await fileExists(filePath)
				console.log(exists, newProject.id)
				if (exists) {
					newProject.id = crypto.randomUUID()
					filePath = path.join(__dirname, '..', 'project', `${newProject.id}.json`)
				}
				idExists = exists
			}

			await fsPromises.writeFile(filePath, JSON.stringify(newProject))

			console.log(filePath)

			// 4 skapa våran response
			return newProject
		},
		createTodo: async (_, args) => {
		// 1 verify name
		if (args.name.length === 0) return new GraphQLError('Name must be at least one character long')

		// 2 skapa ett id
		const newTodo = {
			id: crypto.randomUUID(),
			name: args.name,
		}
		// 3 skapa en fil för projekt i /data/projects

		let myFilePath = path.join(__dirname, '..', 'data', 'mytodos', `${newTodo.id}.json`)

		let idExists = true
		while (idExists) {
			const exists = await fileExists(myFilePath)
			console.log(exists, newTodo.id)
			if (exists) {
				newTodo.id = crypto.randomUUID()
				myFilePath = path.join(__dirname, '..', 'mytodos', `${newTodo.id}.json`)
			}
			idExists = exists
		}

		await fsPromises.writeFile(myFilePath, JSON.stringify(newTodo))

		console.log(myFilePath)

		// 4 skapa våran response
			return newTodo
		},
		updateProject: async (_, args) => {
			// 1 Hämta parameter från args

			/* const projectId = args.id
			const projectName = args.name
			const proectDescription = args.description */
			// den ovan ELLER se nedan
			const {id, name, description} = args

			// 2 Skapa våran filePath
			const filePath = path.join(__dirname, '..', 'data','projects', `${id}.json`)
			// 3 Finns project som de vill ändra?
				//IF (no) return Not Found Error
			const projectExists = await fileExists(filePath)
			if(!projectExists) return new GraphQLError("that project does not exist")
			
			// 4 Skapa updateProject object
			const updateProject = {
				id,
				name,
				description
			}

			// 5 Skriv över den gamla filen med nya infon
			await fsPromises.writeFile(filePath, JSON.stringify(updateProject))

			// return updateProject
			return updateProject
		},
		deleteProject: async (_, args) => {

			//	1 Get projct id
			const projectId = args.projectId

			const filePath = path.join(__dirname, '..', 'data','projects', `${projectId}.json`)

			//	2 Does this project exist?
				// if (not) return Error
				const projectExists = await fileExists(filePath)
				// if (!projectExists) return new GraphQLError("that project doesnt exist")

			// console.log(projectId)

			//	3 delete file
			try {
				await fsPromises.unlink(filePath)
			} catch (error) {
				console.log(projectId)
				return {
					deleteId: projectId,
					success: false
				}
			}

			console.log(projectId)
			return {
				deletedId: projectId,
				success: true
			}
			
		},
		deleteTodo: async (_, args) => {
			//	1 Get projct id
			const todoId = args.todoId
			const todoFilePath = path.join(__dirname, '..', 'data', 'mytodos', `${todoId}.json`)

			//	2 Does this project exist?
				// if (not) return Error
			const todoExist = await fileExists(todoFilePath)

				// if (!projectExists) return new GraphQLError("that project doesnt exist")

			// console.log(projectId)

			//	3 delete file

			try {

			} catch (error){
				console.log(todoId)
				return {
					deletedId: todoId,
					success: false
				}
			}
			
		return {
			deletedId: args.todoId,
			success: true
		}
			
		},
	},
}
