var express = require('express');
var router = express.Router();
var fs = require('fs');
var shell = require('shelljs');
var Telnet = require('telnet-client')


/* GET home page. */
router.post('/start', function(req, res, next) {
    var telnet_port      = req.body.telnet_port;
    var harbor_port      = req.body.harbor_port;
    var harbor_password  = req.body.harbor_password;
    var icecast_host     = req.body.icecast_host;
    var icecast_port     = req.body.icecast_port;
    var icecast_password = req.body.icecast_password;
    var icecast_mount    = req.body.icecast_mount;
    var harbor_port_record    = req.body.harbor_port_record;
    var record_dir    = req.body.record_dir;

    console.log(req.body);
    fs.createReadStream('./../script/template.liq').pipe(fs.createWriteStream('./../script/'+icecast_mount+'.liq'));
    // noinspection JSAnnotator
    fs.chmod('./../script/'+icecast_mount+'.liq', 0777 ,function (err,data) {
        if (err) {
            return console.log(err);
        }
    });

    fs.readFile('./../script/'+icecast_mount+'.liq', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/harbor_port/g,      harbor_port);
        result = result.replace  (/telnet_port/g,      telnet_port);
        result = result.replace  (/harbor_password/g,  harbor_password);
        result = result.replace  (/icecast_host/g,     icecast_host);
        result = result.replace  (/icecast_port/g,     icecast_port);
        result = result.replace  (/icecast_password/g, icecast_password);
        result = result.replace  (/icecast_mount/g,    icecast_mount);
        result = result.replace  (/harbor_record_port/g,    harbor_port_record);
        result = result.replace  (/record_dir/g,    record_dir);

        fs.writeFile('./../script/'+icecast_mount+'.liq', result, 'utf8', function (err) {
            if (err) return console.log(err);
            else {
                shell.exec('./../shell '+icecast_mount,function(code, stdout, stderr) {
                    res.json({
                        'Exit code':code,
                        'Program stdout':stdout,
                        'Program stderr':stderr
                    });
                })
            }

        });
    });


});

router.post('/change/playlist', async function (req, res, next) {
    var mount            = req.body.mount;
    var playlist      = req.body.playlist;
    var telnet_port      = req.body.telnet_port;
    var connection = new Telnet();
    var params = {
        host: '127.0.0.1',
        port: telnet_port,
        shellPrompt: '/ # ',
        timeout: 1500
    };
    await connection.connect(params);
    await connection.exec('default(dot)pls.uri '+playlist);
    await connection.exec(mount+'.skip');
    res.end();
});



module.exports = router;
