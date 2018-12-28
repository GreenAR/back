let express = require('express');
let router = express.Router();
let fs = require('fs');
let path = require('path');
router.get('/episodes/:domain', function(req, res, next) {
    let domain = req.params['domain'];
    const source = './src/'+domain;
    let dirs=getDirs(source);
    let episodes=[];
    for (let i = 0; i < dirs.length; i++) {
        let episode = getFiles(source+'/'+dirs[i]);
        episodes.push({id:dirs[i],name:episode[0],url:"https://" + req.get('host')+'/record/episode/'+dirs[i]+'/'+domain});
    }
    res.json(episodes);
});

router.get('/recorded/:domain', function(req, res, next) {
    let domain = req.params['domain'];
    const source = './src/record/'+domain;
    let episodes=[];
    let episode = getFiles(source);
    for (let i = 0; i < episode.length; i++) {
        episodes.push({name:episode[i],url:"https://" + req.get('host')+'/record/recorded/'+domain+'/'+episode[i]});
    }
		
   res.json(episodes);
});
router.get('/recorded/:domain/:file', function(req, res, next) {

    let domain = req.params['domain'];
    let id = req.params['file'];
    const source = 'src/record/'+domain+'/'+id;
    res.download( source,id);
    //res.sendFile( file,{ root: path.join(__dirname,"..",source,id) });
});





router.get('/episode/:id/:domain', function(req, res, next) {

    let domain = req.params['domain'];
    let id = req.params['id'];
    const source = 'src/'+domain;
    let file=getFiles(source+'/'+id)[0];
    res.download( path.join(source,id,file),file);
    //res.sendFile( file,{ root: path.join(__dirname,"..",source,id) });
});
router.delete('/episode/:id/:domain', function(req, res, next) {

    let domain = req.params['domain'];
    let id = req.params['id'];
    let source = 'src/'+domain;
    let file=getFiles(source+'/'+id)[0];
    source = 'src/'+domain+"/"+id+"/"+file;
    console.log(source);
    fs.unlink(source, (err) => {
        res.status(200);
        res.end();
        if (err)
            next(err);
    });
});

let getDirs = function(rootDir) {
    let files = fs.readdirSync(rootDir);
    let dirs = [];
    for (let index = 0; index < files.length; ++index) {
        let file = files[index];
        if (file[0] !== '.') {
            let filePath = rootDir + '/' + file;
            let stat=fs.statSync(filePath);
            if (stat.isDirectory()) {
                dirs.push(file);
            }
            if (files.length === (index + 1)) {
                return dirs;
            }
        }
    }
}
let getFiles = function(rootDir) {
    let files = fs.readdirSync(rootDir);
    let dirs = [];
    for (let index = 0; index < files.length; ++index) {
        let file = files[index];
        if (file[0] !== '.') {
            let filePath = rootDir + '/' + file;
            let stat=fs.statSync(filePath);
            if (!stat.isDirectory()) {
                dirs.push(file);
            }
            if (files.length === (index + 1)) {
                return dirs;
            }
        }
    }
}
module.exports = router;
