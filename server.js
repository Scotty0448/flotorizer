'use strict'

const express = require('express'),
	path = require('path'),
	fs = require('fs')

const flotorize = require('./src/flotorize.js').flotorize

const app = express()

let WalletOperations = require('./src/walletOperations.js')

let wallet = new WalletOperations()

wallet.init()
const AH = require('./src/AlexandriaHelper')

app.get('/stats', function(req, res, next) {
	wallet.wallet.then((carteira) => {
		const ah = new AH()
		ah.getTotalFlotorizations().then((numOfFlotorizations) => {
			res.send(numOfFlotorizations.toString())
			next()
		})
	})
})

app.get('/flotorize', function(req, res) {
	console.log('got the request')
	let hash = req.param('hs'),
		filename = req.param('f')

	console.log('File: ' + filename)
	console.log('Hash: ' + hash)

	const ah = new AH()
	console.log('Is it in the blockchain?')
	ah.isInBlockChain(hash).then((result) => {
		if (!result.exists) {
			console.log('No! Let\'s make that happen')
			flotorize(filename, hash, wallet).then(function(pdfFilename) {
				let pdfPath = path.resolve(__dirname, 'scratch', pdfFilename)
				console.log('pdf is ready')
				console.log(pdfFilename)
				res.download(pdfPath, pdfFilename, function(err) {
					if (err) {
						console.log('Error: ')
						console.log(err)
					}
					else {
						fs.unlink(pdfPath, (error) => {
							if (err) throw error
							console.log('successfully deleted')
						})
					}
				})
			})
		}
		else {
			let alreadyThereHtml = '<p>This hash already exists in the FLO blockchain.<p>'
			alreadyThereHtml += '<p>If you are trying to verify when this document was flotorized, please click in the link below'
			alreadyThereHtml += '<p>Hash: ' + hash + '</p>'
			alreadyThereHtml += '<p>Transaction: <a href=\'https://florincoin.info/tx/' + result.addr + '\'>' + result.addr + '</a></p>'
			alreadyThereHtml += '<p><a href=\'https://flotorizer.net\'>Flotorize another file</a></p>'
			res.send(alreadyThereHtml)
		}
	})
})

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'assets')))

let port = process.env.PORT || 3000

app.listen(port, function () {
	console.log('Example app listening on port ' + port)
})
