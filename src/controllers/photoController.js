const router = require('express').Router();
const photoManager = require('../managers/photoManager');
const { getErrorMessage } = require('../utils/errorHelpers')

router.get('/create', (req, res) => {

    res.render('photos/create');
});

router.post('/create', async (req, res) => {

    const photoData = {
        ...req.body,
        owner: req.user._id
    };


    try {

        await photoManager.create(photoData)
            .then(() => res.redirect('/photos'));

    } catch (error) {
        res.render('photos/create', {
            error: getErrorMessage(error),  // Fixed the error variable name
            data: photoData  // Sending the entered data back to the view
        });
    }
});

router.get('/', async (req, res) => {
    const photos = await photoManager.getAll().lean();

    res.render('photos', { photos });
});

router.get('/:photoId/details', async (req, res) => {
    const photoId = req.params.photoId
    const photo = await photoManager.getOne(photoId).populate('comments.user').lean();
    const isOwner = req.user?._id == photo.owner._id; //_id because of populate

    res.render('photos/details', { photo, isOwner });
});

router.get('/:photoId/delete', async (req, res) => {
    try {
        const photoId = req.params.photoId;
        await photoManager.delete(photoId);

        res.redirect('/photos')

    } catch (error) {
        res.render(`/photos/${photoId}/details`, { error: 'Unsuccessful deletion' })
    }
});

router.get('/:photoId/edit', async (req, res) => {
    const photoId = req.params.photoId;
    const photo = await photoManager.getOne(photoId).lean();

    res.render('photos/edit', { photo })
});

router.post('/:photoId/edit', async (req, res) => {
    try {
        const photoId = req.params.photoId;
        const photoData = req.body;

        const photo = await photoManager.edit(photoId, photoData);

        res.redirect(`/photos/${photoId}/details`)

    } catch (error) {
        res.render('photos/edit', { error: 'Unable to update photo', ...photoData })
    }
});

router.post('/:photoId/comments', async (req, res) => {
    const photoId = req.params.photoId;
    const message = req.body.message;
    const user = req.user._id;

    try {
        await photoManager.addComment(photoId, { user, message });
        res.redirect(`/photos/${photoId}/details`);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = router;