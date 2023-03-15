const express = require('express');
const router = express.Router();
const controller = require('../controllers/tradeController');
const { isLoggedIn, isHost } = require('../middlewares/auth');
const { validateId } = require('../middlewares/validator');
const { validateTrade, validateResult } = require('../middlewares/validator');

//GET /connections: send all connections to the user
router.get('/', controller.index);

//GET /connections/new: send html form for creating a new connection
router.get('/new', isLoggedIn, controller.new);

//POST /connections: create a new connection
router.post('/', isLoggedIn, validateTrade, validateResult, controller.create);

//GET /connections/:id: send details of connection identified by id
router.get('/:id', validateId, controller.show);

//GET /connections/:id: send html form for editing an existing connection
router.get('/:id/edit', validateId, isLoggedIn, isHost, controller.edit);

//PUT /connections/:id: update the connection identified by id
router.put('/:id', validateId, isLoggedIn, isHost, validateTrade, validateResult, controller.update);

//DELETE /connections/:id: delete the connection identified by id
router.delete('/:id', validateId, isLoggedIn, isHost, controller.delete);

//POST /connections/:id/rsvp: user response to rsvp
router.post('/:id/watch', validateId, isLoggedIn, controller.watchList);

//DELETE /connections/rsvp/:id: delete the rsvp identified by id
router.delete('/watch/:id', validateId, isLoggedIn, controller.deletewatchList);

router.put('/trade/:id', validateId, controller.updateStatus);
module.exports = router;
