/* eslint-disable handle-callback-err */
'use strict'

const fs = require('fs')
let listFiles = ['Finish', 'Language', 'Profile', 'Steps', 'Structure']

function throwError(log = null) {
  return function(error) {
    if (error) throw error
    if (log) console.log(log)
  }
}

module.exports.SaveData = function saveData(file, data, current) {
  let selectFile = selectFileList(file, current)
  if (selectFile === '') return {}
  fs.writeFile(selectFile, JSON.stringify(data), function(error) {
    if (error) return error
    return 200
  })
}

module.exports.ReadData = function readData(file, current) {
  let selectFile = selectFileList(file, current)
  if (selectFile === '') return {}
  const content = fs.readFileSync(selectFile)
  return JSON.parse(content)
}

module.exports.CreateDir = function createdir(project) {
  let target = '../data/' + project
  let response = -1
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, 0o755)
    response = fs.existsSync(target) ? 0 : -1
  }
  if (response === 0) {
    listFiles.forEach(fileElement => {
      fs.copyFile(
        `../data/default/Project${fileElement}.json`,
        `${target}/Project${fileElement}.json`,
        throwError()
      )
    })
  }
  return response
}

module.exports.RenameDir = function renamedir(oldName, newName) {
  let origin = '../data/' + oldName
  let destiny = '../data/' + newName
  let response = -1
  if (!fs.existsSync(destiny)) {
    fs.mkdirSync(destiny, 0o755)
    response = fs.existsSync(destiny) ? 0 : -1
  }
  listFiles.forEach(fileElement => {
    fs.copyFile(
      `${origin}/Project${fileElement}.json`,
      `${destiny}/Project${fileElement}.json`,
      throwError()
    )
  })
  listFiles.forEach(function(fileElement) {
    fs.unlink(
      `${origin}/Project${fileElement}.json`,
      throwError(`Delete: ${destiny}/Project${fileElement}.json`)
    )
  })
  fs.rmdir(origin)
  return response
}

module.exports.DeleteDir = function deletedir(name) {
  let destiny = '../data/' + name
  let response = -1
  if (!fs.existsSync(destiny)) {
    return response
  }
  listFiles.forEach(function(fileElement) {
    fs.unlink(
      `${destiny}/Project${fileElement}.json`,
      throwError(`Delete: ${destiny}/Project${fileElement}.json`)
    )
  })
  fs.rmdir(destiny)
  return 0
}

function selectFileList(file, current) {
  let result = ''
  switch (file) {
    case 'profile':
      result = `../data/${current}/ProjectProfile.json`
      break
    case 'language':
      result = `../data/${current}/ProjectLanguage.json`
      break
    case 'steps':
      result = `../data/${current}/ProjectSteps.json`
      break
    case 'finish':
      result = `../data/${current}/ProjectFinish.json`
      break
    case 'structure':
      result = `../data/${current}/ProjectStructure.json`
      break
    case 'project':
      result = '../data/ProjectList.json'
      break
    default:
      result = ''
  }
  return result
}

module.exports.NewProject = function newProject(projectName) {
  let origen = '../data/' + projectName
  let destiny = '../final/' + projectName
  let language = ''
  language = JSON.parse(
    fs.readFileSync(origen + '/ProjectLanguage.json', (err, data) => {
      if (err) throw err
    })
  )
  // *********** verify no duplicate ********/
  let existold = false
  let info = JSON.parse(
    fs.readFileSync('../final/ProjectList.json', (err, data) => {
      if (err) throw err
    })
  )
  info.projects.forEach(function(element) {
    if (element.name === projectName) existold = true
  })
  if (existold) return 404
  // ********* create directories ***********/
  if (!fs.existsSync(destiny)) {
    fs.mkdirSync(destiny, 0o755)
  }
  if (!fs.existsSync(destiny + '/data')) {
    fs.mkdirSync(destiny + '/data', 0o755)
  }
  language.language.push({
    name: 'English',
    short: 'en'
  })
  language.language.forEach(function(element) {
    if (!fs.existsSync(destiny + '/data/' + element.short)) {
      fs.mkdirSync(destiny + '/data/' + element.short, 0o755)
    }
  })
  // ************* copiar archivos ***********
  fs.copyFile(
    '../final/basic/helper.vue',
    destiny + '/helper.vue',
    throwError()
  )
  fs.copyFile(
    '../final/basic/normalize.css',
    destiny + '/normalize.css',
    throwError()
  )
  fs.copyFile(
    '../final/basic/skeleton.css',
    destiny + '/skeleton.css',
    throwError()
  )
  language.language.forEach(function(element) {
    fs.copyFile(
      origen + '/ProjectFinish.json',
      `${destiny}/data/${element.short}/finish.json`,
      throwError()
    )
    fs.copyFile(
      origen + '/ProjectProfile.json',
      `${destiny}/data/${element.short}/profile.json`,
      throwError()
    )
    fs.copyFile(
      origen + '/ProjectSteps.json',
      `${destiny}/data/${element.short}/steps.json`,
      throwError()
    )
  })
  fs.copyFile(
    origen + '/ProjectStructure.json',
    destiny + '/data/structure.json',
    throwError()
  )
  let temporallanguage = {
    language: []
  }
  language.language.forEach(function(element) {
    temporallanguage.language.push({
      name: element.name,
      short: element.short
    })
  })
  fs.writeFile(
    destiny + '/data/language.json',
    JSON.stringify(temporallanguage),
    function(error) {
      if (error) {
        return error
      }
    }
  )
  info.projects.push({
    name: projectName
  })
  fs.writeFile('../final/ProjectList.json', JSON.stringify(info), function(
    error
  ) {
    if (error) {
      return error
    }
  })
  let lineImports = ''
  let lineRoutes = ''
  let lineSemicolon = ''
  let limit = info.projects.length - 1
  info.projects.forEach(function(element, index) {
    lineImports += `import ${element.name} from './${element.name}/helper'\n`
    lineSemicolon = (index < limit ? ',' : '') + '\n'
    lineRoutes += `
        {
            path: '/${element.name}',
            name: '${element.name}',
            component: ${element.name}
        }${lineSemicolon}`
  })

  let content = `${lineImports}const routes = [
        ${lineRoutes}
    ]

    export default routes`

  fs.writeFile('../final/routeFront.js', content, function(error) {
    if (error) {
      return error
    }
  })
}
